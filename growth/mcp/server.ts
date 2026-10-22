/**
 * OshAds Growth connector — an MCP server that gives Claude traffic, campaign, recommendation
 * and social-planning tools for OshAds and its clients.
 *
 *   stdio (Claude Desktop / Claude Code):  npx tsx --tsconfig growth/tsconfig.json growth/mcp/server.ts
 *   HTTP  (claude.ai custom connector):    ... growth/mcp/server.ts --http   (PORT, default 8787, path /mcp)
 *
 * Safety: Claude can read data and create drafts. Approving and publishing are human-only
 * (growth/agent/review.ts) — there is deliberately no approve/publish tool here.
 */
import { createServer, type IncomingMessage } from 'node:http'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { z } from 'zod'
import { data, usingSampleData } from '../core/data'
import { campaignPerformance, clientBrief, growthOpportunities, recommendApps, trafficSummary } from '../core/insights'
import { escalateComment, listOpenComments, listQueue, POSTING_GUIDE, saveDraftPosts, saveDraftReply } from '../core/social'

const json = (value: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }] })
const fail = (e: unknown) => ({ isError: true, content: [{ type: 'text' as const, text: (e as Error).message }] })
const safe = <A,>(fn: (a: A) => Promise<unknown> | unknown) => async (a: A) => {
  try {
    return json(await fn(a))
  } catch (e) {
    return fail(e)
  }
}

const platforms = z.enum(['instagram', 'linkedin', 'x', 'facebook'])
const categories = z.enum(['loans', 'finance', 'shopping', 'gaming', 'productivity', 'education', 'entertainment', 'lifestyle', 'utilities', 'health', 'travel', 'ai', 'business'])
const readOnly = { readOnlyHint: true, openWorldHint: false } as const

export function buildServer() {
  const server = new McpServer(
    { name: 'oshads-growth', version: '1.0.0' },
    {
      instructions:
        'Tools for OshAds, a first-party app discovery platform. Use get_client_brief and find_growth_opportunities before planning. ' +
        'Social content you create is saved as drafts that a person must approve; never claim something was posted. ' +
        (usingSampleData ? 'Data currently comes from the demo dataset, not live accounts — say so when reporting numbers.' : ''),
    },
  )

  server.registerTool(
    'get_traffic_summary',
    { title: 'Traffic summary', description: 'Owned-site visitors, clicks, downloads and conversion for the last N days vs the previous N days, plus top sources and countries.', inputSchema: { days: z.number().int().min(1).max(365).default(30) }, annotations: readOnly },
    safe(({ days }) => trafficSummary(days)),
  )

  server.registerTool(
    'list_clients',
    { title: 'List clients', description: 'All OshAds clients with id, name, tier and status.', annotations: readOnly },
    safe(async () => (await data.clients()).map((c) => ({ id: c.id, name: c.name, tier: c.tier, status: c.status, industry: c.industry }))),
  )

  server.registerTool(
    'get_client_brief',
    { title: 'Client brief', description: "A client's live apps with taglines, benefits, features and rewards — the source material for any content about them.", inputSchema: { client_id: z.string() }, annotations: readOnly },
    safe(({ client_id }) => clientBrief(client_id)),
  )

  server.registerTool(
    'get_campaign_performance',
    { title: 'Campaign performance', description: 'Impressions, clicks, downloads, CTR, conversion, budget use, target progress and effective CPI per campaign. Filter by client, campaign or status.', inputSchema: { client_id: z.string().optional(), campaign_id: z.string().optional(), status: z.enum(['active', 'paused', 'scheduled', 'completed', 'draft']).optional() }, annotations: readOnly },
    safe(({ client_id, campaign_id, status }) => campaignPerformance({ clientId: client_id, campaignId: campaign_id, status })),
  )

  server.registerTool(
    'find_growth_opportunities',
    { title: 'Find growth opportunities', description: 'Diagnoses a client: weak creatives (low CTR), weak listings (low conversion), pacing problems, live apps without campaigns. Each item has evidence and a suggested action.', inputSchema: { client_id: z.string() }, annotations: readOnly },
    safe(({ client_id }) => growthOpportunities(client_id)),
  )

  server.registerTool(
    'recommend_apps',
    { title: 'Recommend apps', description: 'Runs the OshAds recommendation engine for a visitor profile and returns ranked apps with reasons. Sponsored placements are flagged.', inputSchema: { interests: z.array(categories).default([]), viewed_app_ids: z.array(z.string()).default([]), platform: z.enum(['ios', 'android']).optional(), country: z.string().length(2).optional(), limit: z.number().int().min(1).max(20).default(6) }, annotations: readOnly },
    safe(({ interests, viewed_app_ids, platform, country, limit }) => recommendApps({ interests, viewed: viewed_app_ids, platform, country }, limit)),
  )

  server.registerTool(
    'get_posting_guide',
    { title: 'Posting guide', description: 'Recommended posting windows, caption limits, hashtag counts and tone per platform.', inputSchema: { platform: platforms.optional() }, annotations: readOnly },
    safe(({ platform }) => (platform ? { [platform]: POSTING_GUIDE[platform] } : POSTING_GUIDE)),
  )

  server.registerTool(
    'save_social_drafts',
    {
      title: 'Save social post drafts',
      description: 'Saves planned social posts as drafts for human approval. They are NOT published. Captions must respect the platform limit from get_posting_guide.',
      inputSchema: {
        posts: z
          .array(
            z.object({
              client_id: z.string(),
              app_id: z.string().optional(),
              platform: platforms,
              scheduled_for: z.string().describe('ISO 8601 date-time in the client’s timezone'),
              caption: z.string().min(1),
              hashtags: z.array(z.string()).default([]),
              media_idea: z.string().describe('What the image/video should show'),
              cta: z.string().describe('Call to action, usually the app page link'),
              rationale: z.string().describe('Why this post, this time, this platform — shown to the approver'),
            }),
          )
          .min(1)
          .max(30),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    safe(({ posts }) =>
      saveDraftPosts(
        posts.map((p) => ({ clientId: p.client_id, appId: p.app_id, platform: p.platform, scheduledFor: p.scheduled_for, caption: p.caption, hashtags: p.hashtags, mediaIdea: p.media_idea, cta: p.cta, rationale: p.rationale })),
      ).map((p) => ({ id: p.id, platform: p.platform, scheduledFor: p.scheduledFor, status: p.status })),
    ),
  )

  server.registerTool(
    'list_social_queue',
    { title: 'Social queue', description: 'Posts and replies by status: pending_approval, approved, rejected, published.', inputSchema: { client_id: z.string().optional(), status: z.enum(['pending_approval', 'approved', 'rejected', 'published']).optional() }, annotations: readOnly },
    safe(({ client_id, status }) => listQueue({ clientId: client_id, status })),
  )

  server.registerTool(
    'list_open_comments',
    { title: 'Open comments', description: 'Comments and questions on client social posts that have no reply yet.', inputSchema: { client_id: z.string().optional() }, annotations: readOnly },
    safe(({ client_id }) => listOpenComments(client_id)),
  )

  server.registerTool(
    'draft_comment_reply',
    { title: 'Draft a reply', description: 'Saves a reply to a comment as a draft for human approval. NOT sent until approved.', inputSchema: { comment_id: z.string(), text: z.string().min(1).max(1000), rationale: z.string() }, annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false } },
    safe(({ comment_id, text, rationale }) => saveDraftReply(comment_id, text, rationale)),
  )

  server.registerTool(
    'escalate_comment',
    { title: 'Escalate to a person', description: 'Hand a comment to the human team instead of replying: complaints, bugs/crashes, security or privacy concerns, refunds, legal, abuse.', inputSchema: { comment_id: z.string(), reason: z.string() }, annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false } },
    safe(({ comment_id, reason }) => escalateComment(comment_id, reason)),
  )

  server.registerPrompt(
    'growth_plan',
    { title: 'Growth plan for a client', description: 'Diagnose a client and produce a prioritised 30-day traffic plan.', argsSchema: { client_id: z.string() } },
    ({ client_id }) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Build a 30-day growth plan for OshAds client ${client_id}. Use get_client_brief, find_growth_opportunities, get_campaign_performance and get_traffic_summary. Output: 3 priorities with the evidence for each, specific actions per week, and the metric that will show it worked.`,
          },
        },
      ],
    }),
  )

  server.registerPrompt(
    'social_calendar',
    { title: 'Social calendar', description: 'Plan and draft a social calendar for a client, saved for approval.', argsSchema: { client_id: z.string(), weeks: z.string().default('2') } },
    ({ client_id, weeks }) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Plan ${weeks} week(s) of social posts for OshAds client ${client_id}. Read get_client_brief and get_posting_guide first. Mix platforms, vary formats, schedule in the recommended windows, link every post to the app page, and only state facts present in the brief. Save everything with save_social_drafts, then summarise what is waiting for approval.`,
          },
        },
      ],
    }),
  )

  return server
}

/* ── Transports ── */

async function readBody(req: IncomingMessage) {
  const chunks: Buffer[] = []
  for await (const c of req) chunks.push(c as Buffer)
  const raw = Buffer.concat(chunks).toString('utf8')
  return raw ? JSON.parse(raw) : undefined
}

function authorized(req: IncomingMessage) {
  const token = process.env.OSHADS_CONNECTOR_TOKEN
  if (!token) return true
  const url = new URL(req.url ?? '/', 'http://localhost')
  return req.headers.authorization === `Bearer ${token}` || url.searchParams.get('key') === token
}

async function startHttp() {
  const port = Number(process.env.PORT ?? 8787)
  const http = createServer(async (req, res) => {
    const path = new URL(req.url ?? '/', 'http://localhost').pathname
    if (path === '/healthz') return void res.writeHead(200).end('ok')
    if (path !== '/mcp') return void res.writeHead(404).end()
    if (!authorized(req)) return void res.writeHead(401, { 'WWW-Authenticate': 'Bearer' }).end('unauthorized')
    try {
      // Stateless: a fresh server + transport per request — scales horizontally, no session affinity.
      const server = buildServer()
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined })
      res.on('close', () => {
        void transport.close()
        void server.close()
      })
      await server.connect(transport)
      await transport.handleRequest(req, res, req.method === 'POST' ? await readBody(req) : undefined)
    } catch (e) {
      if (!res.headersSent) res.writeHead(500).end((e as Error).message)
    }
  })
  http.listen(port, () => console.error(`OshAds Growth connector on http://localhost:${port}/mcp${usingSampleData ? ' (demo data)' : ''}`))
}

if (process.argv.includes('--http')) {
  await startHttp()
} else {
  await buildServer().connect(new StdioServerTransport())
}
