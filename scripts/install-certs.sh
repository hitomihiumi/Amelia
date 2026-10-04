#!/usr/bin/env bash
# Copies a TLS certificate into ./certs for the postgres and redis containers and restarts them.
# The containers run as different users and a private key must be readable only by its owner, so each
# service gets its own copy.
#
# 1) Let's Encrypt (certbot) - run once, and as a deploy hook after every renewal:
#      certbot certonly --dns-cloudflare ... -d db.example.com \
#        --deploy-hook "/opt/amelia/scripts/install-certs.sh db.example.com /opt/amelia"
#
# 2) A certificate you already have (for example a Cloudflare Origin CA certificate):
#      sudo scripts/install-certs.sh --cert origin.pem --key origin.key [project-dir]
set -euo pipefail

usage() {
  echo "usage: install-certs.sh <domain> [project-dir]" >&2
  echo "       install-certs.sh --cert <certificate.pem> --key <private.key> [project-dir]" >&2
  exit 2
}

CERT="" KEY=""
if [ "${1:-}" = "--cert" ]; then
  [ "${3:-}" = "--key" ] && [ -n "${2:-}" ] && [ -n "${4:-}" ] || usage
  CERT="$2" KEY="$4" DIR="${5:-}"
else
  DOMAIN="${1:-}"; [ -n "${DOMAIN}" ] || usage
  LIVE="${CERT_LIVE_DIR:-/etc/letsencrypt/live}/${DOMAIN}"
  CERT="${LIVE}/fullchain.pem" KEY="${LIVE}/privkey.pem" DIR="${2:-}"
fi
DIR="${DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"

for file in "${CERT}" "${KEY}"; do
  [ -r "${file}" ] || { echo "Cannot read ${file} (run as root, and issue the certificate first)." >&2; exit 1; }
done

# The key must belong to the certificate, otherwise PostgreSQL and Redis refuse to start with an obscure error.
if command -v openssl >/dev/null 2>&1; then
  cert_pub="$(openssl x509 -in "${CERT}" -noout -pubkey 2>/dev/null | openssl sha256)"
  key_pub="$(openssl pkey -in "${KEY}" -pubout 2>/dev/null | openssl sha256)"
  [ -n "${cert_pub}" ] && [ "${cert_pub}" = "${key_pub}" ] || { echo "The private key does not match the certificate." >&2; exit 1; }
fi

install_for() { # <service> <uid of the user inside the image>
  local dest="${DIR}/certs/$1"
  mkdir -p "${dest}"
  cp -L "${CERT}" "${dest}/fullchain.pem"
  cp -L "${KEY}" "${dest}/privkey.pem"
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
