# OshAds runs as one Node service: it serves the built site AND the /api backend.
# A static-only deploy will not work — the frontend loads its catalogue from /api/public.
# node:sqlite (used by server/db.ts) is built in; no native modules to compile.

# Stage 1: build the site with every dev tool (Vite, TypeScript, Tailwind).
FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: what actually runs. Production packages only (tsx is one), plus the built site and the
# server's source. Keeps the image small, so repeated deploys don't fill the Droplet's disk.
FROM node:24-bookworm-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY tsconfig.json ./
COPY server ./server
COPY src ./src
COPY scripts ./scripts
COPY --from=build /app/dist ./dist

ENV PORT=8788
EXPOSE 8788

# SQLite DB lives here; mount a volume so the catalogue and accounts survive redeploys.
VOLUME ["/app/server/.data"]

# `npm start` sets NODE_ENV=production and serves dist/ + the API.
CMD ["npm", "start"]
