/**
 * Where approved content goes. The default "outbox" publisher writes each item to
 * growth/.data/outbox/ so the whole flow can be exercised end-to-end without live accounts.
 *
 * Live platforms (Meta Graph API for Instagram/Facebook, LinkedIn Marketing API, X API v2) are
 * connected per client with that client's own OAuth credentials; implement `Publisher` for each
 * and register it below. Until a platform is connected, its items go to the outbox — nothing is
 * ever posted to a real account by accident.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { SocialComment, SocialPlatform, SocialPost, SocialReply } from './social'

export interface Publisher {
  publishPost(post: SocialPost): Promise<{ url: string }>
  publishReply(reply: SocialReply, comment: SocialComment): Promise<{ url: string }>
}

const outboxDir = join(dirname(fileURLToPath(import.meta.url)), '..', '.data', 'outbox')

const outbox: Publisher = {
  async publishPost(post) {
    mkdirSync(outboxDir, { recursive: true })
    const file = join(outboxDir, `${post.platform}-${post.id}.json`)
    writeFileSync(file, JSON.stringify(post, null, 2))
    return { url: `file://${file}` }
  },
  async publishReply(reply, comment) {
    mkdirSync(outboxDir, { recursive: true })
    const file = join(outboxDir, `${reply.platform}-${reply.id}.json`)
    writeFileSync(file, JSON.stringify({ inReplyTo: comment, reply }, null, 2))
    return { url: `file://${file}` }
  },
}

/** Register live publishers here as each platform is connected, e.g. `instagram: metaPublisher`. */
const live: Partial<Record<SocialPlatform, Publisher>> = {}

export function publisherFor(platform: SocialPlatform): Publisher {
  return live[platform] ?? outbox
}
