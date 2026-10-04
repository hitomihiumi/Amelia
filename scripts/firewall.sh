#!/usr/bin/env bash
#
# iptables firewall for a host that runs the Amelia compose stack with docker-compose.remote.yml.
#
#   sudo scripts/firewall.sh status
#   sudo scripts/firewall.sh apply [--dry-run] [--yes] [--force]
#   sudo scripts/firewall.sh remove
#   sudo scripts/firewall.sh install-service     # re-apply after every boot / Docker restart
#
# Configuration (environment variables, or /etc/default/amelia-firewall, or the project's .env):
#   SSH_PORT          default 22
#   ADMIN_CIDRS       who may reach SSH, e.g. "203.0.113.7/32 2001:db8::/48". Empty = anyone (rate limited)
#   DB_CIDRS          who may reach PostgreSQL and Redis. Empty = anyone (Vercel has no fixed addresses)
#   POSTGRES_PUBLIC_PORT (5433)  and  REDIS_TLS_PORT (6380)
#   EXTRA_TCP_PORTS   more public TCP ports, e.g. "80 443"
#   WAN_IF            the public interface; detected from the default route
#   GUARD_SECONDS     how long you have to confirm after apply (default 30)
#
# How it works, and why it is not a plain INPUT rule: Docker publishes a port with a DNAT rule, so the
# traffic goes through FORWARD and never touches INPUT. Only the DOCKER-USER chain is yours to filter it,
# and there the destination port is already the container's, so the published (original) port has to be
# matched with conntrack `--ctorigdstport`. IPv6 is the opposite: docker-proxy accepts it on the host,
# so it goes through INPUT. This script handles both and only touches its own chains
# (AMELIA-INPUT, AMELIA-DOCKER); everything else, Docker's rules included, stays as it is.
# Only packets that arrive on the public interface are restricted. Containers, loopback and the
# private (VPC) network are left alone.

set -euo pipefail

SELF="$(readlink -f "${BASH_SOURCE[0]}")"
PROJECT_DIR="${PROJECT_DIR:-$(dirname "$(dirname "$SELF")")}"
IN_CHAIN="AMELIA-INPUT"
DOCKER_CHAIN="AMELIA-DOCKER"
SERVICE_FILE="/etc/systemd/system/amelia-firewall.service"
DEFAULTS_FILE="/etc/default/amelia-firewall"

DRY_RUN=0
ASSUME_YES=0
FORCE=0
NO_GUARD=0

die() { echo "error: $*" >&2; exit 1; }
say() { echo "$*"; }

# ---- configuration -------------------------------------------------------------------------------

# Remember what the caller exported, load defaults files, then let the caller win again.
read_file_var() { # <file> <name>
  [[ -f "$1" ]] || return 0
  grep -E "^[[:space:]]*$2=" "$1" | tail -n1 | sed -E "s/^[[:space:]]*$2=//; s/^['\"]//; s/['\"][[:space:]]*\$//" || true
}

load_config() {
  local name value
  for name in SSH_PORT ADMIN_CIDRS DB_CIDRS POSTGRES_PUBLIC_PORT REDIS_TLS_PORT EXTRA_TCP_PORTS WAN_IF GUARD_SECONDS; do
    if [[ -z "${!name:-}" ]]; then
      value="$(read_file_var "$DEFAULTS_FILE" "$name")"
      [[ -n "$value" ]] || value="$(read_file_var "$PROJECT_DIR/.env" "$name")"
      [[ -z "$value" ]] || printf -v "$name" '%s' "$value"
    fi
  done
  SSH_PORT="${SSH_PORT:-22}"
  ADMIN_CIDRS="${ADMIN_CIDRS:-}"
  DB_CIDRS="${DB_CIDRS:-}"
  POSTGRES_PUBLIC_PORT="${POSTGRES_PUBLIC_PORT:-5433}"
  REDIS_TLS_PORT="${REDIS_TLS_PORT:-6380}"
  EXTRA_TCP_PORTS="${EXTRA_TCP_PORTS:-}"
  GUARD_SECONDS="${GUARD_SECONDS:-30}"

  if [[ -z "${WAN_IF:-}" ]]; then
    WAN_IF="$(ip -o route get 1.1.1.1 2>/dev/null | sed -n 's/.* dev \([^ ]*\).*/\1/p' | head -n1 || true)"
  fi
}

validate_config() {
  local port
  [[ -n "$WAN_IF" ]] || die "cannot detect the public interface, set WAN_IF (see: ip route)"
  for port in "$SSH_PORT" "$POSTGRES_PUBLIC_PORT" "$REDIS_TLS_PORT" $EXTRA_TCP_PORTS; do
    [[ "$port" =~ ^[0-9]+$ ]] && (( port >= 1 && port <= 65535 )) || die "not a valid port: $port"
  done
  [[ "$GUARD_SECONDS" =~ ^[0-9]+$ ]] || die "GUARD_SECONDS must be a number"
  local cidr
  for cidr in $ADMIN_CIDRS $DB_CIDRS; do
    [[ "$cidr" =~ ^[0-9a-fA-F:.]+(/[0-9]+)?$ ]] || die "not a valid address or network: $cidr"
  done
}

# CIDRs of one family out of a list: 4 = no colon, 6 = has a colon.
cidrs_of() { # <family> <list...>
  local family="$1" item
  shift
  for item in "$@"; do
    if [[ "$family" == 6 && "$item" == *:* ]] || [[ "$family" == 4 && "$item" != *:* ]]; then
      echo "$item"
    fi
  done
}

# ---- iptables helpers ----------------------------------------------------------------------------

tool() { [[ "$1" == 6 ]] && echo ip6tables || echo iptables; }

# Runs (or, with --dry-run, prints) one iptables command for the family in $1.
run() {
  local family="$1"
  shift
  local bin
  bin="$(tool "$family")"
  if (( DRY_RUN )); then
    echo "  $bin -w $*"
  else
    "$bin" -w "$@"
  fi
}

# True when the command succeeds; never prints and is never skipped by --dry-run (read-only checks).
probe() {
  local family="$1"
  shift
  "$(tool "$family")" -w "$@" >/dev/null 2>&1
}

have_family() { command -v "$(tool "$1")" >/dev/null 2>&1 && { [[ "$1" == 4 ]] || [[ -e /proc/net/if_inet6 ]]; }; }

unhook() { # <family> <parent> <chain>
  while probe "$1" -C "$2" -j "$3"; do
    run "$1" -D "$2" -j "$3"
    if (( DRY_RUN )); then
      break
    fi
  done
  return 0
}

hook_first() { # <family> <parent> <chain>
  unhook "$1" "$2" "$3"
  run "$1" -I "$2" 1 -j "$3"
}

fresh_chain() { # <family> <chain>
  if probe "$1" -L "$2" -n; then
    run "$1" -F "$2"
  else
    run "$1" -N "$2"
  fi
}

drop_chain() { # <family> <chain>
  if probe "$1" -L "$2" -n; then
    run "$1" -F "$2"
    run "$1" -X "$2"
  fi
}

# ---- rule sets -----------------------------------------------------------------------------------

public_ports() { echo "$POSTGRES_PUBLIC_PORT $REDIS_TLS_PORT $EXTRA_TCP_PORTS"; }

# Which ports may come from where. The database ports follow DB_CIDRS, the rest are open.
db_ports() { echo "$POSTGRES_PUBLIC_PORT $REDIS_TLS_PORT"; }

build_input() { # <family>
  local family="$1" cidr port
  local icmp="icmp"
  [[ "$family" == 6 ]] && icmp="ipv6-icmp"

  fresh_chain "$family" "$IN_CHAIN"
  run "$family" -A "$IN_CHAIN" -i lo -j ACCEPT
  run "$family" -A "$IN_CHAIN" -m conntrack --ctstate RELATED,ESTABLISHED -j ACCEPT
  run "$family" -A "$IN_CHAIN" -m conntrack --ctstate INVALID -j DROP
  # Ping, path MTU discovery and (IPv6) neighbour discovery must keep working.
  run "$family" -A "$IN_CHAIN" -p "$icmp" -m limit --limit 20/second --limit-burst 40 -j ACCEPT
  # Containers talking to the host (docker-proxy, the host's DNS and so on).
  run "$family" -A "$IN_CHAIN" -i docker0 -j ACCEPT
  run "$family" -A "$IN_CHAIN" -i 'br-+' -j ACCEPT

  # SSH
  local admins
  admins="$(cidrs_of "$family" $ADMIN_CIDRS | xargs || true)"
  if [[ -n "$ADMIN_CIDRS" ]]; then
    for cidr in $admins; do
      run "$family" -A "$IN_CHAIN" -s "$cidr" -p tcp --dport "$SSH_PORT" -j ACCEPT
    done
  else
    run "$family" -A "$IN_CHAIN" -p tcp --dport "$SSH_PORT" -m conntrack --ctstate NEW \
      -m hashlimit --hashlimit-name "amelia-ssh$family" --hashlimit-mode srcip \
      --hashlimit-above 10/minute --hashlimit-burst 10 -j DROP
    run "$family" -A "$IN_CHAIN" -p tcp --dport "$SSH_PORT" -j ACCEPT
  fi

  # Databases (IPv6 reaches them through docker-proxy, so this is where IPv6 is decided)
  local dbs
  dbs="$(cidrs_of "$family" $DB_CIDRS | xargs || true)"
  for port in $(db_ports); do
    if [[ -z "$DB_CIDRS" ]]; then
      run "$family" -A "$IN_CHAIN" -p tcp --dport "$port" -j ACCEPT
    else
      for cidr in $dbs; do
        run "$family" -A "$IN_CHAIN" -s "$cidr" -p tcp --dport "$port" -j ACCEPT
      done
    fi
  done
  for port in $EXTRA_TCP_PORTS; do
    run "$family" -A "$IN_CHAIN" -p tcp --dport "$port" -j ACCEPT
  done

  # Everything else that arrives on the public interface is dropped.
  run "$family" -A "$IN_CHAIN" -i "$WAN_IF" -j DROP
}

build_docker() { # <family>
  local family="$1" cidr port dbs
  fresh_chain "$family" "$DOCKER_CHAIN"
  run "$family" -A "$DOCKER_CHAIN" -m conntrack --ctstate RELATED,ESTABLISHED -j RETURN
  # Anything that did not arrive on the public interface (container to container, container to the
  # internet, the private network) is not our business.
  run "$family" -A "$DOCKER_CHAIN" ! -i "$WAN_IF" -j RETURN

  dbs="$(cidrs_of "$family" $DB_CIDRS | xargs || true)"
  for port in $(db_ports); do
    if [[ -z "$DB_CIDRS" ]]; then
      run "$family" -A "$DOCKER_CHAIN" -p tcp -m conntrack --ctorigdstport "$port" -j RETURN
    else
      for cidr in $dbs; do
        run "$family" -A "$DOCKER_CHAIN" -s "$cidr" -p tcp -m conntrack --ctorigdstport "$port" -j RETURN
      done
    fi
  done
  for port in $EXTRA_TCP_PORTS; do
    run "$family" -A "$DOCKER_CHAIN" -p tcp -m conntrack --ctorigdstport "$port" -j RETURN
  done

  # A published port nobody listed (for example 6379 or 5632 if they were ever published) stays closed.
  run "$family" -A "$DOCKER_CHAIN" -j DROP
}

apply_family() { # <family>
  local family="$1"
  say "IPv${family}:"
  build_input "$family"
  # Docker creates DOCKER-USER itself; without Docker running (or, for IPv6, without ip6tables
  # support in Docker) there is nothing to protect there.
  if ! probe "$family" -L DOCKER-USER -n; then
    if [[ "$family" == 4 ]]; then
      run "$family" -N DOCKER-USER
      run "$family" -A DOCKER-USER -j RETURN
    fi
  fi
  if (( DRY_RUN )) || probe "$family" -L DOCKER-USER -n; then
    build_docker "$family"
    hook_first "$family" DOCKER-USER "$DOCKER_CHAIN"
  fi
  hook_first "$family" INPUT "$IN_CHAIN"
}

remove_family() { # <family>
  local family="$1"
  unhook "$family" INPUT "$IN_CHAIN"
  unhook "$family" DOCKER-USER "$DOCKER_CHAIN"
  drop_chain "$family" "$IN_CHAIN"
  drop_chain "$family" "$DOCKER_CHAIN"
}

# ---- lock-out protection ------------------------------------------------------------------------

# Refuses a configuration that would cut off the SSH session this script runs in.
check_own_session() {
  [[ -n "$ADMIN_CIDRS" && -n "${SSH_CONNECTION:-}" ]] || return 0
  local client="${SSH_CONNECTION%% *}"
  command -v python3 >/dev/null 2>&1 || { say "warning: python3 is missing, cannot check that $client is in ADMIN_CIDRS"; return 0; }
  if ! python3 - "$client" $ADMIN_CIDRS <<'PY'
import ipaddress, sys
client = ipaddress.ip_address(sys.argv[1])
for item in sys.argv[2:]:
    try:
        if client in ipaddress.ip_network(item, strict=False):
            sys.exit(0)
    except ValueError:
        pass
sys.exit(1)
PY
  then
    (( FORCE )) && { say "warning: your SSH address $client is not in ADMIN_CIDRS (--force given)"; return 0; }
    die "your SSH address $client is not in ADMIN_CIDRS, applying would lock you out (use --force to override)"
  fi
}

# After apply: unless you confirm, a detached job removes our chains again. It survives a dropped SSH
# session, which is exactly the case it is for.
guard_and_confirm() {
  (( ASSUME_YES || NO_GUARD )) && return 0

  setsid nohup bash -c "sleep $GUARD_SECONDS; PROJECT_DIR='$PROJECT_DIR' '$SELF' remove" >/dev/null 2>&1 &
  local guard_pid=$!
  say
  say "The rules are active. If you can still use SSH, type 'yes' within ${GUARD_SECONDS}s to keep them;"
  say "otherwise they are removed automatically."
  local answer=""
  read -r -t "$GUARD_SECONDS" -p "Keep the firewall? [yes/no] " answer || true
  if [[ "$answer" == "yes" ]]; then
    kill "$guard_pid" 2>/dev/null || true
    say "Kept. Run '$SELF install-service' to apply it on every boot."
  else
    say "Not confirmed, removing the rules."
    kill "$guard_pid" 2>/dev/null || true
    remove_all
    exit 1
  fi
}

# ---- commands ------------------------------------------------------------------------------------

apply_all() {
  local family
  for family in 4 6; do
    if have_family "$family"; then
      apply_family "$family"
    fi
  done
}

remove_all() {
  local family
  for family in 4 6; do
    have_family "$family" && remove_family "$family"
  done
  return 0
}

cmd_apply() {
  load_config
  validate_config
  check_own_session
  if (( ! DRY_RUN && ! ASSUME_YES && ! NO_GUARD )) && [[ ! -t 0 ]]; then
    die "no terminal to confirm on: run it from a terminal, or pass --yes"
  fi
  say "Public interface: $WAN_IF"
  say "SSH: port $SSH_PORT, from ${ADMIN_CIDRS:-anywhere (rate limited)}"
  say "Databases: ports $(db_ports | xargs | tr ' ' ','), from ${DB_CIDRS:-anywhere}"
  [[ -z "$EXTRA_TCP_PORTS" ]] || say "Also open: $EXTRA_TCP_PORTS"
  say
  if (( DRY_RUN )); then
    say "Dry run, nothing is changed. The commands would be:"
  fi
  apply_all
  if (( DRY_RUN )); then
    return 0
  fi
  say
  say "Applied."
  guard_and_confirm
}

cmd_remove() {
  load_config
  remove_all
  say "Removed the Amelia firewall chains (everything else is untouched)."
}

cmd_status() {
  load_config
  local family active
  say "Public interface: ${WAN_IF:-unknown}"
  for family in 4 6; do
    have_family "$family" || continue
    active="inactive"
    probe "$family" -C INPUT -j "$IN_CHAIN" && active="active"
    say
    say "IPv$family: $active"
    if [[ "$active" == active ]]; then
      "$(tool "$family")" -w -S "$IN_CHAIN" | sed 's/^/  /'
      if probe "$family" -L "$DOCKER_CHAIN" -n; then
        "$(tool "$family")" -w -S "$DOCKER_CHAIN" | sed 's/^/  /'
      fi
      probe "$family" -C DOCKER-USER -j "$DOCKER_CHAIN" || say "  warning: $DOCKER_CHAIN is not hooked into DOCKER-USER (published ports are not filtered)"
    fi
  done
  if command -v ss >/dev/null 2>&1; then
    say
    say "Listening sockets that are not loopback:"
    ss -H -ltn 2>/dev/null | awk '$4 !~ /^(127\.|\[::1\])/ {print "  " $4}' | sort -u
  fi
}

cmd_install_service() {
  load_config
  validate_config
  [[ $EUID -eq 0 ]] || die "run as root"
  command -v systemctl >/dev/null 2>&1 || die "systemd is not available"

  cat >"$DEFAULTS_FILE" <<EOF
# Read by scripts/firewall.sh and amelia-firewall.service. Edit, then: systemctl restart amelia-firewall
SSH_PORT=$SSH_PORT
ADMIN_CIDRS="$ADMIN_CIDRS"
DB_CIDRS="$DB_CIDRS"
POSTGRES_PUBLIC_PORT=$POSTGRES_PUBLIC_PORT
REDIS_TLS_PORT=$REDIS_TLS_PORT
EXTRA_TCP_PORTS="$EXTRA_TCP_PORTS"
WAN_IF=$WAN_IF
EOF
  cat >"$SERVICE_FILE" <<EOF
[Unit]
Description=Amelia firewall (iptables chains for the public database ports)
After=network-online.target docker.service
Wants=network-online.target
# Docker re-creates its own chains when it restarts; re-apply afterwards.
PartOf=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
Environment=PROJECT_DIR=$PROJECT_DIR
ExecStart=$SELF apply --yes
ExecStop=$SELF remove

[Install]
WantedBy=multi-user.target docker.service
EOF
  systemctl daemon-reload
  systemctl enable amelia-firewall.service
  say "Installed $SERVICE_FILE and $DEFAULTS_FILE."
  say "Start it with: systemctl restart amelia-firewall   (it reads $DEFAULTS_FILE)"
}

usage() {
  sed -n '3,22p' "$SELF" | sed 's/^# \{0,1\}//'
  exit "${1:-0}"
}

main() {
  local command="${1:-}"
  [[ -n "$command" ]] || usage 1
  shift || true
  local arg
  for arg in "$@"; do
    case "$arg" in
      --dry-run) DRY_RUN=1 ;;
      --yes|-y) ASSUME_YES=1 ;;
      --force) FORCE=1 ;;
      --no-guard) NO_GUARD=1 ;;
      -h|--help) usage 0 ;;
      *) die "unknown option: $arg" ;;
    esac
  done
  case "$command" in
    -h|--help|help) usage 0 ;;
  esac
  if (( ! DRY_RUN )) && [[ $EUID -ne 0 ]]; then
    die "run as root (sudo $0 $command)"
  fi
  command -v iptables >/dev/null 2>&1 || die "iptables is not installed"
  case "$command" in
    apply) cmd_apply ;;
    remove) cmd_remove ;;
    status) cmd_status ;;
    install-service) cmd_install_service ;;
    *) usage 1 ;;
  esac
}

main "$@"
