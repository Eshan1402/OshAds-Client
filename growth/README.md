# OshAds Growth — Claude connector, plugin and social agent

Three traffic engines share one core (`growth/core/` + `src/lib/recommend.ts`):

| Engine | What it does | Where |
|---|---|---|
| **Recommendation algorithm** | Matches each visitor to the most relevant client apps (interests, browsing history, quality, momentum, capped campaign boost, diversity). Explains every pick; flags sponsored ones. | `src/lib/recommend.ts` — used by the website and the connector |
| **Claude connector (MCP)** | Gives Claude 12 tools: traffic, clients, campaign performance, growth diagnosis, recommendations, posting guide, social drafts, replies, escalation. | `growth/mcp/server.ts` |
| **Claude Code plugin** | Packages the connector with `/growth-plan`, `/social-calendar`, `/social-replies` and a `social-manager` subagent. | `plugins/oshads-growth/` |
| **Social media agent** | Plans calendars, drafts posts, drafts or escalates comment replies — all into an approval queue. | `growth/agent/social-agent.ts` |

**Safety by design:** Claude (connector, plugin or agent) can read data and create drafts. Only a person approves (`npm run social:review`), and only approved items are published (`npm run social:publish`).

Data: the demo dataset is used until you set `OSHADS_API_URL` (and `OSHADS_API_TOKEN`) to the live OshAds API — see `growth/core/data.ts` for the expected endpoints.

---

## 1. Claude Desktop (local, stdio)

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) — use the absolute project path:

```json
{
  "mcpServers": {
    "oshads-growth": {
      "command": "npx",
      "args": ["tsx", "--tsconfig", "/ABSOLUTE/PATH/Prototype2/growth/tsconfig.json", "/ABSOLUTE/PATH/Prototype2/growth/mcp/server.ts"]
    }
  }
}
```

Restart Claude Desktop. Try: *"Use oshads-growth to build a growth plan for cl_northwind."*

## 2. Claude Code

- **In this repo:** the project `.mcp.json` registers the connector automatically — approve it when Claude Code asks.
- **As a plugin anywhere:** start the HTTP connector (step 3), then in Claude Code:
  ```
  /plugin marketplace add /ABSOLUTE/PATH/Prototype2
  /plugin install oshads-growth@oshads
  ```
  The plugin connects to `OSHADS_CONNECTOR_URL` (default `http://localhost:8787/mcp`) with `OSHADS_CONNECTOR_TOKEN`.

## 3. claude.ai (Pro / Max) — custom connector

claude.ai connects to remote MCP servers over HTTPS.

1. Deploy the HTTP connector on any Node host (Render, Railway, Fly.io, a VPS):
   ```bash
   OSHADS_CONNECTOR_TOKEN=<long-random-secret> PORT=8787 npm run mcp:http
   ```
   Put it behind HTTPS (the host's TLS or a reverse proxy). Health check: `GET /healthz`.
2. In claude.ai: **Settings → Connectors → Add custom connector**, URL:
   `https://your-host/mcp?key=<long-random-secret>`
3. Enable it in a chat and ask for a growth plan or social calendar.

> The `?key=` secret is a simple gate for pilots. For production, add OAuth to the HTTP server (claude.ai custom connectors support OAuth) so each user signs in with their own account.

## 4. Social media agent

Needs Claude API access: `ANTHROPIC_API_KEY`, or `ant auth login`. Model: `claude-opus-5-5` (override with `OSHADS_AGENT_MODEL`).

```bash
npm run social:agent -- plan --client cl_northwind --weeks 2   # draft a 2-week calendar
npm run social:agent -- replies --client cl_northwind           # draft or escalate replies
npm run social:agent -- daily                                   # every active client
npm run social:review                                           # approve / edit / reject
npm run social:publish                                          # send approved items that are due
```

Schedule the daily run with cron, e.g. `0 8 * * * cd /path/Prototype2 && npm run social:agent -- daily`.

**Publishing:** approved items go to `growth/.data/outbox/` until a platform is connected. To go live, implement `Publisher` for each platform in `growth/core/publishers.ts` using the client's own OAuth credentials (Meta Graph API for Instagram/Facebook, LinkedIn Marketing API, X API v2) — each platform requires its own developer app and review.

## Costs to plan for (paid by the client, not included in the build fee)
Hosting/server for the website and connector, the database, Claude API usage by the agent, and any social-platform API fees.
