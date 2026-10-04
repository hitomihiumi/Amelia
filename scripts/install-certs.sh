#!/usr/bin/env bash
# Copies a Let's Encrypt certificate into ./certs for the postgres and redis containers and restarts them.
# The containers run as different users and a private key must be readable only by its owner, so each
# service gets its own copy.
#
#   sudo scripts/install-certs.sh db.example.com
#
# As a certbot deploy hook it runs again after every renewal:
#
#   certbot certonly --standalone -d db.example.com \
#     --deploy-hook "/opt/amelia/scripts/install-certs.sh db.example.com /opt/amelia"
set -euo pipefail

DOMAIN="${1:?usage: install-certs.sh <domain> [project-dir]}"
DIR="${2:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
LIVE="${CERT_LIVE_DIR:-/etc/letsencrypt/live}/${DOMAIN}"

for file in fullchain.pem privkey.pem; do
  [ -r "${LIVE}/${file}" ] || { echo "Cannot read ${LIVE}/${file} (run as root, and issue the certificate first)." >&2; exit 1; }
done

install_for() { # <service> <uid of the user inside the image>
  local dest="${DIR}/certs/$1"
  mkdir -p "${dest}"
  cp -L "${LIVE}/fullchain.pem" "${dest}/fullchain.pem"
  cp -L "${LIVE}/privkey.pem" "${dest}/privkey.pem"
  chown "$2:$2" "${dest}" "${dest}/fullchain.pem" "${dest}/privkey.pem"
  chmod 700 "${dest}"
  chmod 644 "${dest}/fullchain.pem"
  chmod 600 "${dest}/privkey.pem"
  echo "installed certificate for $1"
}

install_for postgres 70   # postgres:*-alpine
install_for redis 999     # redis:*-alpine

cd "${DIR}"
if command -v docker >/dev/null 2>&1 && [ -n "$(docker compose ps -q postgres 2>/dev/null || true)" ]; then
  docker compose -f docker-compose.yml -f docker-compose.remote.yml restart postgres redis
fi
