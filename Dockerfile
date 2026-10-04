FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./prisma.config.ts

RUN npm install
RUN npx prisma generate

COPY . .

RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma/
COPY --from=builder /app/assets ./assets
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/scripts/db.mjs ./scripts/db.mjs

# pg_dump/pg_restore/psql for scripts/db.mjs (backups and restore around migrations).
# The client must be at least as new as the server: reinstall the image after a PostgreSQL upgrade.
RUN apk add --no-cache postgresql-client

ENV NODE_ENV=production

CMD ["npm", "start"]

