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
    MONGODB_URL="mongodb://mongodb:27017/amelia"
    ```

3.  **Start the bot**:

    ```bash
    docker-compose up -d
    ```

    This command will:
    - Start a PostgreSQL database container.
    - Start a MongoDB container.
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

3.  **Start MongoDB**:
    ```bash
    docker run -d \
      --name amelia_mongodb \
      --network amelia-network \
      -v mongodb_data:/data/db \
      mongo:6
    ```

4.  **Start the Bot**:
    ```bash
    docker run -d \
      --name amelia_bot \
      --network amelia-network \
      -e TOKEN=your_discord_bot_token \
      -e DATABASE_URL="postgresql://user:password@amelia_postgres:5432/amelia?schema=public" \
      -e MONGODB_URL="mongodb://amelia_mongodb:27017/amelia" \
      ghcr.io/hitomihiumi/amelia:latest
    ```

## Manual Deployment (without Docker)

If you prefer to run the bot directly on your system without Docker, follow these steps.

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18 or higher)
-   [PostgreSQL](https://www.postgresql.org/)
-   [MongoDB](https://www.mongodb.com/)

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
    MONGODB_URL="mongodb://localhost:27017/amelia"
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

-   **Database connection issues**: Ensure the `DATABASE_URL` and `MONGODB_URL` in your `.env` file match the service names and credentials defined in `docker-compose.yml`.
