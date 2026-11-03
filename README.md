# OshAds — App Discovery Platform (Frontend)

Owned-traffic app discovery platform + campaign management console.
**Driven by results.** First-party app discovery and campaign console for Oshads Media LLC.

React 19 · TypeScript · Vite · Tailwind CSS v4 · Framer Motion · React Three Fiber/Drei · Recharts · Lucide · React Router 7

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build
```

## Running it

```bash
cp .env.example .env.local          # then set SEED_PASSWORD (12+ chars)
npm run server                      # API, login, traffic counter → http://localhost:8788
npm run dev                         # website → http://localhost:5173 (proxies /api to the server)
```

On first start the server creates `server/.data/oshads.db` with the starter catalogue and the staff account
from `src/data/users.ts`, using `SEED_PASSWORD`.

**Production:** `npm run build && npm start` — one Node process serves the built site and the API on `PORT`.
Put it behind HTTPS (nginx, Caddy or your host's proxy) that keeps the `Host` header and sets `X-Forwarded-For`,
then set `TRUST_PROXY=1` and `SITE_URL`. Back up `server/.data/` (or point `DB_PATH` at a persistent volume).

**Dashboard numbers are all real** (server/analytics.ts), refreshed every 15 s:
visitors (cookieless, per day) · sessions (30-min inactivity) · impressions (app cards at least half on screen) ·
clicks (Download / Visit website) · **downloads = confirmed installs** · revenue (payouts sent with confirmations).
Country needs a CDN header (Cloudflare `CF-IPCountry` etc.) with `TRUST_PROXY=1`; without one it shows "Unknown".

**Osh coins (no login):** every Download click gets a `click_id`; a visitor's anonymous wallet (browser storage)
gets 20 coins pending for that app. Coins and the download count are confirmed when the advertiser's tracker calls
`/api/postback?click_id={click_id}&event=install&payout={payout}&key=$POSTBACK_KEY`, or when staff press
Confirm in **Dashboard → Rewards**. Put `{click_id}` in an app's tracking URL so the tracker receives it.

## Demo access

The login page's demo panel (dev only) fills in a starter account. The server enforces each role:

| Role | Can |
|---|---|
| Admin (Priya) | everything, incl. team & roles and **Settings → Reset demo data** (resets the server's catalogue for everyone) |
| Manager (Marcus) | campaigns, apps, clients, reports |
| Analyst (Dana) | read analytics, export reports — write actions and routes are hidden, and the API refuses them |

## Routes

Public: `/`, `/explore`, `/trending`, `/categories`, `/categories/:slug`, `/app/:slug`, `/search`, `/about`, `/login`
Dashboard (protected): `/dashboard`, `/dashboard/campaigns[/new|/:id]`, `/dashboard/apps[/new|/:id|/:id/edit]`,
`/dashboard/clients[/new|/:id|/:id/edit]`, `/dashboard/analytics`, `/dashboard/traffic`, `/dashboard/reports`,
`/dashboard/notifications`, `/dashboard/settings`

## Architecture

```
src/
  types/        domain model (MobileApp, Campaign, Client, KPIs, …) — the API contract
  data/         seed data (deterministic, no lorem ipsum)
  services/     the only layer that touches data
    api.ts          local copy of the server's data (`db`, `request`) + `save` for writes
    queryClient.ts  tiny cache with dedupe + prefix invalidation
    realtime.ts     pub/sub stand-in for WebSocket/SSE (live visitors, notifications)
    *Service.ts     apps, campaigns, clients, analytics, auth, search, reports, notifications
  hooks/        useQuery, useDebounce, useMediaQuery, useLocalStorage, …
  context/      Theme, Auth (roles/permissions), Toast, Dashboard (shared date range)
  components/
    ui/         design system primitives (Button, Badge, Card, Form, Modal, Menu, Tabs, Skeleton, …)
    layout/     public + dashboard shells, nav, sidebar, topbar
    apps/       AppCard, TrendingCard, CategoryTile, AppScreen (procedural screenshots), gallery
    3d/         HeroScene, Phone3D, canvas screen textures, DOM fallback
    charts/     TrafficChart, FunnelChart, DonutChart
    analytics/  KPI cards, breakdowns (sources/geo/devices/OS), panels
    campaigns/  CampaignTable + actions
  pages/        public/* and dashboard/* (all route-level code-split)
  routes/       router, ProtectedRoute (auth + permission), error boundary
```

### Server (`server/`)

One Node process, no extra dependencies (built-in `node:sqlite`): `index.ts` routes, `auth.ts` (scrypt hashes,
httpOnly session cookies, per-IP login throttling, role checks), `db.ts` (documents stored as JSON in the shapes from
`src/types`), `events.ts` (traffic counter). Public visitors receive live apps only; recommendations run on the server
so campaign budgets never reach the browser.

Next steps: per-kind validation of saved documents (zod is installed), a WebSocket for `services/realtime.ts`,
and pointing `growth/core/data.ts` at this API.

## Design system

Tokens live in `src/styles/index.css`: OshAds royal blue (`brand-600` #1B3FD0, sampled from the logo) primary with theme-aware gradient stops (`--grad-1…4`), cool Ink neutrals, semantic `bg / surface / line / fg / muted / subtle` tokens with full dark-mode overrides, and a chart palette validated for colour-blind separation and 3:1 contrast in both themes. Type: Manrope (display), Inter (UI), JetBrains Mono (eyebrows).

## Performance & accessibility notes

- three.js (~265 KB gz) is code-split and only loaded on desktop, after idle, with WebGL available and reduced-motion off; everyone else gets a DOM/CSS device composition. The canvas pauses when off-screen.
- Recharts only loads on dashboard routes; no 3D/chart code in the initial bundle.
- Skip link, focus-visible rings, focus-trapped dialogs, ARIA roles on tabs/menus/radio groups/comboboxes, `prefers-reduced-motion` honoured (CSS + Framer `MotionConfig`).
# OshAds-Client
