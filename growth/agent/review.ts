/**
 * Human approval desk for agent-drafted social content.
 *
 *   npm run social:review                 # walk through every pending item: approve / edit / reject / skip
 *   npm run social:review -- --client cl_northwind
 *   npm run social:publish                # send approved items that are due (outbox until platforms are connected)
 */
import { createInterface } from 'node:readline/promises'
import { parseArgs } from 'node:util'
import { listEscalations, listOpenComments, listQueue, publishApproved, review } from '../core/social'

const { values, positionals } = parseArgs({ allowPositionals: true, options: { client: { type: 'string' }, reviewer: { type: 'string', default: process.env.USER ?? 'reviewer' } } })

if (positionals[0] === 'publish') {
  const results = await publishApproved()
  if (!results.length) console.log('Nothing approved and due.')
  for (const r of results) console.log(`${r.ok ? '✓' : '✗'} ${r.id}  ${r.detail}`)
  process.exit(0)
}

const rl = createInterface({ input: process.stdin, output: process.stdout })
const { posts, replies } = listQueue({ clientId: values.client, status: 'pending_approval' })
const items = [...posts, ...replies]
console.log(`\n${items.length} item(s) awaiting approval${values.client ? ` for ${values.client}` : ''}.\n`)

for (const item of items) {
  console.log('─'.repeat(64))
  if (item.kind === 'post') {
    console.log(`POST  ${item.id}  [${item.platform}]  ${item.clientId}  → ${item.scheduledFor}`)
    console.log(`\n${item.caption}\n${item.hashtags.map((h) => `#${h.replace(/^#/, '')}`).join(' ')}`)
    console.log(`\nMedia: ${item.mediaIdea}\nCTA:   ${item.cta}\nWhy:   ${item.rationale}`)
  } else {
    console.log(`REPLY ${item.id}  [${item.platform}]  ${item.clientId}`)
    console.log(`\n${item.text}\n\nWhy:   ${item.rationale}`)
  }
  const answer = (await rl.question('\n[a]pprove  [e]dit+approve  [r]eject  [s]kip > ')).trim().toLowerCase()
  if (answer === 'a') review(item.id, 'approved', values.reviewer!)
  else if (answer === 'e') review(item.id, 'approved', values.reviewer!, 'edited by reviewer', await rl.question('New text: '))
  else if (answer === 'r') review(item.id, 'rejected', values.reviewer!, await rl.question('Reason (optional): '))
}

const esc = listEscalations(values.client)
if (esc.length) {
  console.log(`\n⚑ ${esc.length} comment(s) escalated to the team:`)
  for (const c of esc) console.log(`  ${c.id} [${c.platform}] ${c.author}: "${c.text}" — ${c.escalation!.reason}`)
}
const open = listOpenComments(values.client)
if (open.length) console.log(`\n${open.length} comment(s) still without a draft — run the agent with "replies".`)
rl.close()
