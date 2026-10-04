# Deployment Guide

This guide explains how to deploy the Amelia bot using Docker and Docker Compose.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Installation

1.  **Download the `docker-compose.yml` file** from the [latest release](https://github.com/hitomihiumi/amelia/releases).

2.  **Create a `.env` file** in the same directory as `docker-compose.yml`. You can use the example below:

    ```dotenv
    # Discord Bot Token
    TOKEN=your_discord_bot_token
    
    # Environment
    NODE_ENV=production
    
    # Database URLs (configured for the docker-compose services)
    DATABASE_URL="postgresql://user:password@postgres:5432/amelia?schema=public"
    REDIS_URL="redis://redis:6379"
    ```

3.  **Start the bot**:

    ```bash
    docker-compose up -d
    ```

    This command will:
    - Start a PostgreSQL database container.
    - Start a Redis cache container.
    - Pull the latest bot image and start it.

## Updating

To update the bot to the latest version:

1.  Pull the latest images:
    ```bash
    docker-compose pull
    ```

2.  Restart the containers:
    ```bash
    docker-compose up -d
    ```

The `migrate` service runs `node scripts/db.mjs deploy` before the bot starts:

1. it waits for PostgreSQL and checks the migration history;
2. when there is something to apply, it takes a backup into `./backups` (the last 10 are kept, `DB_BACKUP_KEEP`
   changes that);
3. it applies the migrations with `prisma migrate deploy`;
4. if a migration fails, it **restores that backup** (one transaction, all or nothing), compares the row counts
   and exits with an error, so the bot does not start on a half-migrated database.

It never resets anything. If the migration history does not match the files (see below), it stops without
changing anything and the bot does not start either. Inspect and fix it with
`docker compose run --rm migrate node scripts/db.mjs status` / `repair` / `baseline`.

## Logs in the admin panel

The `logs` service (a separate small image, `ghcr.io/hitomihiumi/amelia-logs`) reads the logs of the
containers of this compose project (bot, migrate, PostgreSQL, Redis, itself excluded) and keeps their
warnings and errors for 24 hours in Redis. The dashboard shows them on **Admin → Logs**. It needs the
Docker socket (mounted read-only, but access to it is root-equivalent on the host); delete the service
from `docker-compose.yml` if you do not want that. Containers of other projects are never read.

## Dashboard on another host (for example Vercel)

By default PostgreSQL and Redis are published on `127.0.0.1` only, so nothing outside the machine can reach
them. A dashboard that runs elsewhere (Vercel has no fixed IP addresses and cannot join a private network)
has to connect over the internet, and then the databases need a password **and** encryption.
`docker-compose.remote.yml` does that on top of the base file:

- PostgreSQL listens with TLS. `docker/postgres/pg_hba.conf` accepts plain connections only from the private
  Docker network (bot, migrate); anything else must use TLS and a password, a plain connection from a public
  address is rejected before a password can be tried.
- Redis requires `REDIS_PASSWORD` and offers TLS on port 6380 (6379 stays plain, inside the compose network).
- `POSTGRES_PASSWORD` and `REDIS_PASSWORD` are mandatory: `docker compose` refuses to start without them.

1. **DNS and certificate.** Create an `A` record (for example `db.hitomihiumi.xyz`) for the droplet in
   Cloudflare and set it to **DNS only** (grey cloud). Cloudflare's proxy carries HTTP(S) only, PostgreSQL and
   Redis cannot go through the orange cloud, and the proxy would hide the TLS certificate anyway.
   Then pick one of the two certificate options:

   - **Cloudflare Origin CA certificate (what you already have).** Save the certificate and the key on the
     server (for example as `origin.pem` and `origin.key`) and install them:
     ```bash
     sudo scripts/install-certs.sh --cert origin.pem --key origin.key /opt/amelia
     ```
     The script checks that the key belongs to the certificate, copies both into `./certs/postgres` and
     `./certs/redis` and restarts the databases. The host name you connect to must be covered by the
     certificate (Origin CA certificates normally list `hitomihiumi.xyz` and `*.hitomihiumi.xyz`).
     **Catch:** an Origin CA certificate is trusted by Cloudflare only, not by browsers, operating systems or
     Node.js. The dashboard therefore has to be told which CA to trust, see step 5
     (`DATABASE_SSL_CA` and `REDIS_TLS_CA`). Origin CA certificates are valid for up to 15 years, so there is
     no renewal job.
   - **Let's Encrypt through the DNS challenge.** A publicly trusted certificate, so Vercel needs no extra
     setting. Port 80 is not needed, Cloudflare's API is used to prove the domain. Create an API token with
     `Zone / DNS / Edit` for the zone and put it into a file that only root can read:
     ```bash
     sudo apt install certbot python3-certbot-dns-cloudflare
     printf 'dns_cloudflare_api_token = <token>\n' | sudo tee /root/cloudflare.ini >/dev/null
     sudo chmod 600 /root/cloudflare.ini
     sudo certbot certonly --dns-cloudflare --dns-cloudflare-credentials /root/cloudflare.ini \
       -d db.hitomihiumi.xyz \
       --deploy-hook "/opt/amelia/scripts/install-certs.sh db.hitomihiumi.xyz /opt/amelia"
     ```
     The hook installs the certificate after the first issue and after every renewal.
2. **Passwords.** `POSTGRES_PASSWORD` only applies when the data volume is created. For an existing database
   change it explicitly, then set the same value in `.env` (`POSTGRES_PASSWORD` and the bot's `DATABASE_URL`):
   ```bash
   docker compose exec postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "ALTER USER $POSTGRES_USER PASSWORD 'new-strong-password'"
   ```
   Set `REDIS_PASSWORD` in `.env` and add it to the bot's `REDIS_URL`: `redis://:<password>@redis:6379`.
   Use long random values (`openssl rand -base64 32`); URL-encode special characters in the URLs.
3. **Start.**
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.remote.yml up -d
   ```
   Add `-f docker-compose.remote.yml` to every later compose command too (or set
   `COMPOSE_FILE=docker-compose.yml:docker-compose.remote.yml` in `.env`).
4. **Firewall (iptables).** Without a cloud firewall, the host has to do it, and Docker needs special care:
   a published port is forwarded (DNAT) and bypasses the `INPUT` chain, so an `iptables -A INPUT -j DROP` rule
   or `ufw` does **not** protect it. `scripts/firewall.sh` writes the rules where they count and only touches
   its own chains (`AMELIA-INPUT`, `AMELIA-DOCKER`):
   ```bash
   sudo scripts/firewall.sh apply --dry-run     # prints the commands, changes nothing
   sudo scripts/firewall.sh apply
   sudo scripts/firewall.sh status
   sudo scripts/firewall.sh install-service     # re-apply on boot and after Docker restarts
   ```
   - On the public interface only SSH (`SSH_PORT`, default 22), PostgreSQL (`POSTGRES_PUBLIC_PORT`) and Redis
     (`REDIS_TLS_PORT`) are reachable, plus `EXTRA_TCP_PORTS` if you set it. Everything else, including a port
     Docker publishes by mistake (6379, 5632), is dropped. Loopback, the Docker networks and the private
     network are not restricted.
   - SSH is open to everyone, so a changing home address never locks you out. Compensate on the server:
     key-only login (`PasswordAuthentication no` in `/etc/ssh/sshd_config`) and, optionally, `fail2ban`.
   - `DB_CIDRS` limits the database ports to some networks. Leave it empty for Vercel, which has no fixed
     addresses.
   - After `apply` you have 30 seconds to type `yes` from the same session; otherwise the rules are removed
     automatically, so a mistake cannot lock you out of the server. `--yes` skips this (the service uses it).
   - The public interface is detected from the default route; set `WAN_IF` if that is wrong.
   - IPv4 and IPv6 are both handled. `sudo scripts/firewall.sh remove` takes everything back out.
   Check from the outside afterwards, for example `nmap -Pn -p 22,5433,5632,6379,6380 <droplet-ip>`: only
   22, 5433 and 6380 may be open.
5. **Vercel environment variables.**
   ```dotenv
   DATABASE_URL=postgresql://<user>:<password>@db.hitomihiumi.xyz:5433/<database>?sslmode=verify-full
   REDIS_URL=rediss://:<password>@db.hitomihiumi.xyz:6380
   ```
   `sslmode=verify-full` checks the certificate and the host name (the `node-postgres` driver treats `require`
   the same way). `rediss://` (two s) is Redis over TLS.

   With a **Cloudflare Origin CA** certificate add the Cloudflare Origin CA root certificate, which the
   dashboard then trusts instead of the system roots (download it from Cloudflare's "Origin CA root
   certificates" documentation: the RSA root if your certificate has an RSA key, the ECC root for ECC):
   ```dotenv
   DATABASE_SSL_CA=<contents of the root PEM>
   REDIS_TLS_CA=<contents of the root PEM>
   ```
   The value may be the PEM text itself, the PEM with `\n` instead of line breaks, or its base64. The
   certificate and the host name are still verified, only the trusted authority changes. With Let's Encrypt
   leave both unset.

If Vercel's static IPs are available on your plan, list them in `DB_CIDRS` to restrict the two ports to them.

## Database maintenance (backups, migrations, PostgreSQL upgrades)

`scripts/db.mjs` needs only Node 18+. In a checkout run it as `npm run db -- <command>`; next to a
`docker-compose.yml` without a checkout, download that single file and run `node db.mjs <command>`.
With a running `postgres` compose service it works through docker compose, so no PostgreSQL tools are
needed on the host; otherwise it uses `DATABASE_URL` with `pg_dump`/`pg_restore`/`psql` from `PATH`
(or `PG_BIN_DIR`).

| Command | What it does |
| --- | --- |
| `status` | PostgreSQL version, size, backups and the state of the migration history |
| `backup` | Dump to `backups/` (custom format) with a row-count snapshot; keeps the last 10 (`--keep N`) |
| `migrate` | Backup, then `prisma migrate deploy`. Refuses to touch a history that needs repair |
| `repair` | Fixes a history Prisma would ask a reset for. Only `_prisma_migrations` is changed, never your data |
| `baseline` | Adopts a database that has tables but no migration history |
| `restore <file>` | Restores a dump in one transaction (all or nothing) after taking a safety backup |
| `verify [file]` | Compares row counts with the snapshot of a backup |
| `upgrade-pg <major>` | Docker: major PostgreSQL upgrade with all data kept (see below) |

Add `--dry-run` to see what a command would do, `--yes` to skip the prompts, `--no-backup` to skip the safety backup.

### "Prisma wants to reset the database"

Prisma asks for a reset when the migrations recorded in the database and the files in `prisma/migrations`
disagree. Typical causes: another project (the dashboard used to ship its own migration) ran migrations against
the same database, a migration file was edited after it was applied, or the database was created without
Prisma Migrate. Run `npm run db -- status` to see which one it is, then:

- *recorded in the database but missing from prisma/migrations*, *file was edited*, *failed migration* → `repair`
- *tables but no migration history* → `baseline`
- *migrations to apply* → `migrate`

Never answer "yes" to a `prisma migrate reset` / `migrate dev` prompt on a database that holds real data.

### Upgrading PostgreSQL to a new major version

A new major version cannot read the old data directory, so changing the image tag by hand leaves the
database unreadable. Use:

```bash
npm run db -- upgrade-pg 17        # add --dry-run first to see the plan
```

It dumps the database, keeps a copy of the old data volume (`<volume>_pg15_<timestamp>`, not deleted),
starts the new version on a fresh volume, restores the dump in one transaction, runs the migrations,
compares every table's row count with the snapshot and only then starts the bot. The image tag comes from
`POSTGRES_VERSION` in `.env`, which the command updates. If anything fails before the bot is started, the
command prints the exact steps to go back.

## Deployment with Docker (without Compose)

If you want to run the containers manually using the Docker CLI:

1.  **Create a Docker network**:
    ```bash
    docker network create amelia-network
    ```

2.  **Start PostgreSQL**:
    ```bash
    docker run -d \
      --name amelia_postgres \
      --network amelia-network \
      -e POSTGRES_USER=user \
      -e POSTGRES_PASSWORD=password \
      -e POSTGRES_DB=amelia \
      -v postgres_data:/var/lib/postgresql/data \
      postgres:15-alpine
    ```

3.  **Start Redis**:
    ```bash
    docker run -d \
      --name amelia_redis \
      --network amelia-network \
      -v redis_data:/data \
      redis:7-alpine
    ```

4.  **Start the Bot**:
    ```bash
    docker run -d \
      --name amelia_bot \
      --network amelia-network \
      -e TOKEN=your_discord_bot_token \
      -e DATABASE_URL="postgresql://user:password@amelia_postgres:5432/amelia?schema=public" \
      -e REDIS_URL="redis://amelia_redis:6379" \
      ghcr.io/hitomihiumi/amelia:latest
    ```

## Manual Deployment (without Docker)

If you prefer to run the bot directly on your system without Docker, follow these steps.

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18 or higher)
-   [PostgreSQL](https://www.postgresql.org/)
-   [Redis](https://redis.io/)

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/hitomihiumi/amelia.git
    cd amelia
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Configure Environment**:
    Create a `.env` file in the root directory:
    ```dotenv
    TOKEN=your_discord_bot_token
    DATABASE_URL="postgresql://user:password@localhost:5432/amelia?schema=public"
    REDIS_URL="redis://localhost:6379"
    ```

4.  **Generate Prisma Client**:
    ```bash
    npx prisma generate
    ```

5.  **Build the project**:
    ```bash
    npm run build
    ```

6.  **Start the bot**:
    ```bash
    npm start
    ```

### Keeping it running

For production, it is recommended to use a process manager like [PM2](https://pm2.keymetrics.io/) to keep the bot running:

```bash
npm install -g pm2
pm2 start dist/index.js --name amelia
```

## Troubleshooting

-   **Check logs**:
    ```bash
    docker-compose logs -f bot
    ```

-   **Database connection issues**: Ensure the `DATABASE_URL` and `REDIS_URL` in your `.env` file match the service names and credentials defined in `docker-compose.yml`.
