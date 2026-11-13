# OshAds runs as one Node service: it serves the built site AND the /api backend.
# A static-only deploy will not work — the frontend loads its catalogue from /api/public.
# node:sqlite (used by server/db.ts) is built in; no native modules to compile.
FROM node:24-bookworm-slim
WORKDIR /app

# Install deps (dev deps included: the build and `npm start`/tsx need them).
COPY package*.json ./
RUN npm ci

# Build the site into dist/.
COPY . .
RUN npm run build

ENV PORT=8788
EXPOSE 8788

# SQLite DB lives here; mount a volume so the catalogue and accounts survive redeploys.
VOLUME ["/app/server/.data"]

# `npm start` sets NODE_ENV=production and serves dist/ + the API.
CMD ["npm", "start"]
