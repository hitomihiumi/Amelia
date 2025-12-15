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

## Troubleshooting

-   **Check logs**:
    ```bash
    docker-compose logs -f bot
    ```

-   **Database connection issues**: Ensure the `DATABASE_URL` and `MONGODB_URL` in your `.env` file match the service names and credentials defined in `docker-compose.yml`.

