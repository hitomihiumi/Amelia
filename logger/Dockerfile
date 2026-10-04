# Tiny image (Node + ioredis) for the log collector; the bot image is not needed for it.
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force

COPY index.mjs ./

ENV NODE_ENV=production

CMD ["node", "index.mjs"]
