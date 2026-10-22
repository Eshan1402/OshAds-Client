/**
 * Social content store + approval workflow.
 *
 *   agent drafts ──► pending_approval ──(human approves)──► approved ──(publisher)──► published
 *                                    └─(human rejects)──► rejected
 *
 * The AI side (MCP connector, social agent) can only create drafts and read state.
 * `approve` / `reject` are called exclusively by the human review CLI (growth/agent/review.ts),
 * and `publishApproved` only ever publishes items a person has approved.
 */
import { randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { publisherFor } from './publishers'

export type SocialPlatform = 'instagram' | 'linkedin' | 'x' | 'facebook'
export type ItemStatus = 'pending_approval' | 'approved' | 'rejected' | 'published'

export interface SocialPost {
  id: string
  kind: 'post'
  clientId: string
  appId?: string
  platform: SocialPlatform
  scheduledFor: string
  caption: string
  hashtags: string[]
  mediaIdea: string
  cta: string
  rationale: string
  status: ItemStatus
  createdAt: string
  reviewedBy?: string
  reviewNote?: string
  publishedAt?: string
  externalUrl?: string
}

export interface SocialComment {
  id: string
  clientId: string
  platform: SocialPlatform
  author: string
  text: string
  receivedAt: string
  postRef: string
  /** Set when the agent hands a sensitive comment to a person instead of drafting a reply. */
  escalation?: { reason: string; at: string }
}

export interface SocialReply {
  id: string
  kind: 'reply'
  commentId: string
  clientId: string
  platform: SocialPlatform
  text: string
  rationale: string
  status: ItemStatus
  createdAt: string
  reviewedBy?: string
  reviewNote?: string
  publishedAt?: string
}

interface Store {
  posts: SocialPost[]
  replies: SocialReply[]
  comments: SocialComment[]
}

const here = dirname(fileURLToPath(import.meta.url))
const FILE = process.env.OSHADS_SOCIAL_STORE ?? join(here, '..', '.data', 'social.json')

/** Starting defaults per platform — tune from each client's own engagement data once it exists. */
export const POSTING_GUIDE: Record<SocialPlatform, { bestWindows: string[]; captionLimit: number; hashtags: string; tone: string }> = {
  instagram: { bestWindows: ['Tue–Thu 11:00–13:00', 'Sun 18:00–20:00'], captionLimit: 2200, hashtags: '3–8 specific tags', tone: 'visual, warm, benefit-first' },
  linkedin: { bestWindows: ['Tue–Thu 08:00–10:00'], captionLimit: 3000, hashtags: '1–3 tags', tone: 'professional, outcome-led, no slang' },
  x: { bestWindows: ['Mon–Fri 09:00–11:00', 'Mon–Fri 17:00–19:00'], captionLimit: 280, hashtags: '0–2 tags', tone: 'punchy, one idea per post' },
  facebook: { bestWindows: ['Wed–Fri 13:00–15:00'], captionLimit: 2000, hashtags: '0–3 tags', tone: 'friendly, community-oriented' },
}

function seedComments(): SocialComment[] {
  const at = (h: number) => new Date(Date.now() - h * 3600_000).toISOString()
  return [
    { id: 'cm_1', clientId: 'cl_northwind', platform: 'instagram', author: '@finance.with.ria', text: 'Does Ledgerly work with credit unions too?', receivedAt: at(3), postRef: 'Ledgerly launch reel' },
    { id: 'cm_2', clientId: 'cl_northwind', platform: 'x', author: '@markb', text: 'Is my bank login stored anywhere? Bit nervous about these apps.', receivedAt: at(6), postRef: 'Budgeting tips thread' },
    { id: 'cm_3', clientId: 'cl_skyforge', platform: 'instagram', author: '@tactician_zed', text: 'Season 7 is 🔥 when do guild wars come back??', receivedAt: at(2), postRef: 'Season 7 trailer' },
    { id: 'cm_4', clientId: 'cl_skyforge', platform: 'facebook', author: 'Sam Patel', text: 'Game crashes on my old Android since the update.', receivedAt: at(9), postRef: 'Patch notes post' },
    { id: 'cm_5', clientId: 'cl_lingua', platform: 'linkedin', author: 'Helena Ortiz', text: 'Do you offer team licences for language training at work?', receivedAt: at(20), postRef: 'Workplace learning article' },
  ]
}

function load(): Store {
  if (!existsSync(FILE)) return { posts: [], replies: [], comments: seedComments() }
  return JSON.parse(readFileSync(FILE, 'utf8')) as Store
}
function save(s: Store) {
  mkdirSync(dirname(FILE), { recursive: true })
  writeFileSync(FILE, JSON.stringify(s, null, 2))
}

export type NewPost = Omit<SocialPost, 'id' | 'kind' | 'status' | 'createdAt'>

/** AI-callable: store drafts for review. Always lands in pending_approval. */
export function saveDraftPosts(items: NewPost[]) {
  const s = load()
  const created = items.map((p) => {
    const limit = POSTING_GUIDE[p.platform].captionLimit
    if (p.caption.length > limit) throw new Error(`${p.platform} caption is ${p.caption.length} chars; limit ${limit}`)
    return { ...p, id: `post_${randomUUID().slice(0, 8)}`, kind: 'post' as const, status: 'pending_approval' as const, createdAt: new Date().toISOString() }
  })
  s.posts.push(...created)
  save(s)
  return created
}

/** AI-callable: draft a reply to a comment. Always lands in pending_approval. */
export function saveDraftReply(commentId: string, text: string, rationale: string) {
  const s = load()
  const c = s.comments.find((x) => x.id === commentId)
  if (!c) throw new Error(`Unknown comment ${commentId}`)
  s.replies = s.replies.filter((r) => !(r.commentId === commentId && r.status === 'pending_approval'))
  const reply: SocialReply = { id: `rep_${randomUUID().slice(0, 8)}`, kind: 'reply', commentId, clientId: c.clientId, platform: c.platform, text, rationale, status: 'pending_approval', createdAt: new Date().toISOString() }
  s.replies.push(reply)
  save(s)
  return reply
}

export function listQueue(filter: { clientId?: string; status?: ItemStatus } = {}) {
  const s = load()
  const ok = (x: { clientId: string; status: ItemStatus }) => (!filter.clientId || x.clientId === filter.clientId) && (!filter.status || x.status === filter.status)
  return { posts: s.posts.filter(ok), replies: s.replies.filter(ok) }
}

/** Comments with no reply sent or pending yet. */
export function listOpenComments(clientId?: string) {
  const s = load()
  const handled = new Set(s.replies.filter((r) => r.status !== 'rejected').map((r) => r.commentId))
  return s.comments.filter((c) => (!clientId || c.clientId === clientId) && !handled.has(c.id) && !c.escalation)
}

/** AI-callable: hand a comment to a human (complaints, security, refunds, legal, abuse). */
export function escalateComment(commentId: string, reason: string) {
  const s = load()
  const c = s.comments.find((x) => x.id === commentId)
  if (!c) throw new Error(`Unknown comment ${commentId}`)
  c.escalation = { reason, at: new Date().toISOString() }
  save(s)
  return c
}

export function listEscalations(clientId?: string) {
  return load().comments.filter((c) => c.escalation && (!clientId || c.clientId === clientId))
}

/* ── Human-only operations (review CLI) ── */

export function review(id: string, decision: 'approved' | 'rejected', reviewer: string, note?: string, editedText?: string) {
  const s = load()
  const item = s.posts.find((p) => p.id === id) ?? s.replies.find((r) => r.id === id)
  if (!item) throw new Error(`Unknown item ${id}`)
  if (item.status !== 'pending_approval') throw new Error(`${id} is ${item.status}, not pending`)
  if (editedText) {
    if (item.kind === 'post') item.caption = editedText
    else item.text = editedText
  }
  item.status = decision
  item.reviewedBy = reviewer
  item.reviewNote = note
  save(s)
  return item
}

/** Publishes approved items whose time has come (posts) or that are ready (replies). */
export async function publishApproved(now = new Date()) {
  const s = load()
  const results: Array<{ id: string; ok: boolean; detail: string }> = []
  for (const p of s.posts.filter((x) => x.status === 'approved' && new Date(x.scheduledFor) <= now)) {
    try {
      const r = await publisherFor(p.platform).publishPost(p)
      Object.assign(p, { status: 'published', publishedAt: new Date().toISOString(), externalUrl: r.url })
      results.push({ id: p.id, ok: true, detail: r.url })
    } catch (e) {
      results.push({ id: p.id, ok: false, detail: (e as Error).message })
    }
  }
  for (const r of s.replies.filter((x) => x.status === 'approved')) {
    const c = s.comments.find((x) => x.id === r.commentId)!
    try {
      const out = await publisherFor(r.platform).publishReply(r, c)
      Object.assign(r, { status: 'published', publishedAt: new Date().toISOString() })
      results.push({ id: r.id, ok: true, detail: out.url })
    } catch (e) {
      results.push({ id: r.id, ok: false, detail: (e as Error).message })
    }
  }
  save(s)
  return results
}
