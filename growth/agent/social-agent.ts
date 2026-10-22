/**
 * OshAds social media agent — plans a client's content calendar, drafts posts, and drafts replies
 * to comments. Everything it produces lands in the approval queue; a person approves with
 * `npm run social:review`, and only then does `npm run social:publish` send it.
 *
 *   npm run social:agent -- plan    --client cl_northwind --weeks 2
 *   npm run social:agent -- replies --client cl_northwind
 *   npm run social:agent -- daily                       # replies for every active client + top up calendars
 *
 * Built on the Claude API Tool Runner: the SDK runs the tool loop; the tools are the same core
 * functions the MCP connector exposes. Requires ANTHROPIC_API_KEY (or an `ant auth login` profile).
 */
import Anthropic from '@anthropic-ai/sdk'
import { betaZodTool } from '@anthropic-ai/sdk/helpers/beta/zod'
import { parseArgs } from 'node:util'
import { z } from 'zod'
import { data, usingSampleData } from '../core/data'
import { clientBrief, growthOpportunities } from '../core/insights'
import { escalateComment, listOpenComments, listQueue, POSTING_GUIDE, saveDraftPosts, saveDraftReply } from '../core/social'

const MODEL = process.env.OSHADS_AGENT_MODEL ?? 'claude-opus-5-5'

const platform = z.enum(['instagram', 'linkedin', 'x', 'facebook'])
const asJson = (v: unknown) => JSON.stringify(v, null, 2)

const tools = [
  betaZodTool({
    name: 'get_client_brief',
    description: "A client's live apps: taglines, benefits, features, rewards and page URLs. The only allowed source of product facts.",
    inputSchema: z.object({ client_id: z.string() }),
    run: async ({ client_id }) => asJson(await clientBrief(client_id)),
  }),
  betaZodTool({
    name: 'find_growth_opportunities',
    description: 'Campaign diagnosis for a client — which apps need visibility, weak creatives, pacing problems.',
    inputSchema: z.object({ client_id: z.string() }),
    run: async ({ client_id }) => asJson(await growthOpportunities(client_id)),
  }),
  betaZodTool({
    name: 'get_posting_guide',
    description: 'Best posting windows, caption limits, hashtag counts and tone per platform.',
    inputSchema: z.object({}),
    run: async () => asJson(POSTING_GUIDE),
  }),
  betaZodTool({
    name: 'list_social_queue',
    description: 'Already planned/approved/published items — check before planning to avoid duplicates and gaps.',
    inputSchema: z.object({ client_id: z.string() }),
    run: async ({ client_id }) => asJson(listQueue({ clientId: client_id })),
  }),
  betaZodTool({
    name: 'save_social_drafts',
    description: 'Save planned posts for human approval (not published).',
    inputSchema: z.object({
      posts: z
        .array(
          z.object({
            client_id: z.string(),
            app_id: z.string().optional(),
            platform,
            scheduled_for: z.string().describe('ISO 8601 date-time'),
            caption: z.string(),
            hashtags: z.array(z.string()),
            media_idea: z.string(),
            cta: z.string(),
            rationale: z.string(),
          }),
        )
        .min(1)
        .max(30),
    }),
    run: async ({ posts }) =>
      asJson(
        saveDraftPosts(posts.map((p) => ({ clientId: p.client_id, appId: p.app_id, platform: p.platform, scheduledFor: p.scheduled_for, caption: p.caption, hashtags: p.hashtags, mediaIdea: p.media_idea, cta: p.cta, rationale: p.rationale }))).map((p) => ({
          id: p.id,
          platform: p.platform,
          scheduledFor: p.scheduledFor,
        })),
      ),
  }),
  betaZodTool({
    name: 'list_open_comments',
    description: 'Comments with no reply yet.',
    inputSchema: z.object({ client_id: z.string() }),
    run: async ({ client_id }) => asJson(listOpenComments(client_id)),
  }),
  betaZodTool({
    name: 'draft_comment_reply',
    description: 'Save a reply draft for human approval (not sent).',
    inputSchema: z.object({ comment_id: z.string(), text: z.string().max(1000), rationale: z.string() }),
    run: async ({ comment_id, text, rationale }) => asJson(saveDraftReply(comment_id, text, rationale)),
  }),
  betaZodTool({
    name: 'escalate_comment',
    description: 'Hand a comment to the human team instead of replying.',
    inputSchema: z.object({ comment_id: z.string(), reason: z.string() }),
    run: async ({ comment_id, reason }) => asJson(escalateComment(comment_id, reason)),
  }),
]

const SYSTEM = `You are the social media manager for OshAds, an app discovery platform, working on behalf of its client app publishers.

Planning posts:
- Read the client brief, the posting guide and the existing queue first. Fill gaps; never duplicate a scheduled post.
- Schedule inside each platform's recommended windows, in the client's timezone. Spread posts; at most one per platform per day.
- Vary formats (benefit spotlight, how-to, reward announcement, social proof from store rating, question to the audience).
- Every product claim must come from the client brief. Do not invent statistics, testimonials, awards or features.
- Keep within the caption limit, use the platform's hashtag guidance, and end with a clear CTA linking to the app's OshAds page.
- Give each post a one-sentence rationale the approver will read.

Replying to comments:
- Draft short, warm, specific replies in the brand's voice. Answer only what the brief supports; if unsure, invite them to the app page or support rather than guessing.
- Escalate instead of replying for: bugs or crashes, security or privacy worries, billing or refunds, legal or regulatory questions, harassment, or anything angry or sensitive.

You only create drafts. A person approves everything before it is published — never say that something has been posted or sent.`

function taskPrompt(mode: string, clientId: string, weeks: number) {
  if (mode === 'plan') return `Plan and draft ${weeks} week(s) of social posts for client ${clientId}, starting tomorrow (today is ${new Date().toDateString()}). Save them with save_social_drafts, then give me a short summary.`
  return `Handle the open comments for client ${clientId}: draft a reply or escalate each one. Then summarise what you did.`
}

async function run(mode: 'plan' | 'replies', clientId: string, weeks: number) {
  const client = new Anthropic()
  const runner = client.beta.messages.toolRunner({
    model: MODEL,
    max_tokens: 16000,
    max_iterations: 30,
    thinking: { type: 'adaptive' },
    output_config: { effort: 'medium' },
    // Server-side refusal fallback: routes a declined request to a suitable model automatically.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system: SYSTEM + (usingSampleData ? '\n\nNote: running on demo data, not live accounts.' : ''),
    tools,
    messages: [{ role: 'user', content: taskPrompt(mode, clientId, weeks) }],
  })

  for await (const message of runner) {
    for (const block of message.content) {
      if (block.type === 'tool_use') console.error(`  · ${block.name}`)
    }
  }
  const final = await runner.done()
  if (final.stop_reason === 'refusal') {
    console.error(`Declined (${final.stop_details?.category ?? 'unspecified'}). Nothing was saved for this step.`)
    return
  }
  const text = final.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('\n')
  console.log(`\n[${clientId} · ${mode}]\n${text}\n`)
}

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { client: { type: 'string' }, weeks: { type: 'string', default: '1' } },
})
const mode = positionals[0]

try {
  if (mode === 'daily') {
    const active = (await data.clients()).filter((c) => c.status === 'active')
    for (const c of active) {
      if (listOpenComments(c.id).length) await run('replies', c.id, 1)
      const upcoming = listQueue({ clientId: c.id }).posts.filter((p) => p.status !== 'rejected' && new Date(p.scheduledFor) > new Date())
      if (upcoming.length < 3) await run('plan', c.id, 1)
    }
  } else if ((mode === 'plan' || mode === 'replies') && values.client) {
    await run(mode, values.client, Number(values.weeks))
  } else {
    console.error('Usage: social-agent plan --client <id> [--weeks N] | replies --client <id> | daily')
    process.exitCode = 1
  }
} catch (e) {
  if (e instanceof Anthropic.AuthenticationError) console.error('Not authenticated: set ANTHROPIC_API_KEY or run `ant auth login`.')
  else if (e instanceof Anthropic.RateLimitError) console.error('Rate limited — try again shortly.')
  else if (e instanceof Anthropic.APIError) console.error(`Claude API error ${e.status}: ${e.message}`)
  else throw e
  process.exitCode = 1
}
