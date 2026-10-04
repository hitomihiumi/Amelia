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

The `migrate` service applies new migrations with `prisma migrate deploy`. It never resets anything:
if the migration history does not match, it stops and the bot does not start (see below).

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
