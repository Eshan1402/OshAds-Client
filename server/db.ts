/**
 * One SQLite file holds everything: catalogue documents, users, sessions and traffic events.
 * Documents keep the exact shapes in src/types, stored as JSON, so the front end needs no mapping layer.
 */
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { apps } from '../src/data/apps'
import { campaigns } from '../src/data/campaigns'
import { clients } from '../src/data/clients'
import { notifications, savedReports } from '../src/data/notifications'

export const KINDS = ['apps', 'campaigns', 'clients', 'reports', 'notifications'] as const
export type Kind = (typeof KINDS)[number]
export type Doc = { id: string } & Record<string, unknown>

const DB_PATH = process.env.DB_PATH ?? 'server/.data/oshads.db'
if (DB_PATH !== ':memory:') mkdirSync(dirname(DB_PATH), { recursive: true })

export const sql = new DatabaseSync(DB_PATH)
sql.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS docs (
    kind TEXT NOT NULL, id TEXT NOT NULL, pos INTEGER NOT NULL, data TEXT NOT NULL,
    PRIMARY KEY (kind, id)
  );
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE COLLATE NOCASE, data TEXT NOT NULL, password_hash TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires_at INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS events (
    ts INTEGER NOT NULL, day TEXT NOT NULL, visitor TEXT NOT NULL,
    type TEXT NOT NULL, app_id TEXT, path TEXT, source TEXT
  );
  CREATE INDEX IF NOT EXISTS events_day_type ON events (day, type);
  CREATE INDEX IF NOT EXISTS events_visitor_ts ON events (visitor, ts);
  CREATE INDEX IF NOT EXISTS events_ts ON events (ts);
  -- One row per Download click; click_id is what advertisers' trackers send back in postbacks.
  CREATE TABLE IF NOT EXISTS clicks (
    click_id TEXT PRIMARY KEY, ts INTEGER NOT NULL, day TEXT NOT NULL, app_id TEXT NOT NULL, visitor TEXT NOT NULL,
    wallet_id TEXT, source TEXT, device TEXT, os TEXT, country TEXT
  );
  CREATE INDEX IF NOT EXISTS clicks_day ON clicks (day);
  -- Confirmed installs/usage: from an advertiser postback or a staff confirmation. These are "downloads".
  CREATE TABLE IF NOT EXISTS conversions (
    id INTEGER PRIMARY KEY, ts INTEGER NOT NULL, day TEXT NOT NULL, click_id TEXT NOT NULL, app_id TEXT NOT NULL,
    event TEXT NOT NULL, payout REAL NOT NULL DEFAULT 0, via TEXT NOT NULL, UNIQUE (click_id, event)
  );
  CREATE INDEX IF NOT EXISTS conversions_day ON conversions (day);
  -- Osh coins: one reward per wallet per app, pending until the install is confirmed.
  CREATE TABLE IF NOT EXISTS rewards (
    id INTEGER PRIMARY KEY, wallet_id TEXT NOT NULL, app_id TEXT NOT NULL, click_id TEXT NOT NULL, coins INTEGER NOT NULL,
    status TEXT NOT NULL, created_ts INTEGER NOT NULL, decided_ts INTEGER, UNIQUE (wallet_id, app_id)
  );
`)
// Columns added after the first release: add them to existing databases.
const eventCols = new Set(sql.prepare('PRAGMA table_info(events)').all().map((c) => String(c.name)))
for (const col of ['device', 'os', 'country', 'label']) if (!eventCols.has(col)) sql.exec(`ALTER TABLE events ADD COLUMN ${col} TEXT`)
if (!eventCols.has('value')) sql.exec('ALTER TABLE events ADD COLUMN value REAL')
// v1: visitor ids gained a kind prefix ("d" daily, "c" cookie). Every id stored before v1 is a daily one.
if (Number((sql.prepare('PRAGMA user_version').get() as { user_version: number }).user_version) < 1) {
  sql.exec("UPDATE events SET visitor = 'd' || visitor; UPDATE clicks SET visitor = 'd' || visitor; PRAGMA user_version = 1")
}

const seed: Record<Kind, Doc[]> = {
  apps: apps as unknown as Doc[],
  campaigns: campaigns as unknown as Doc[],
  clients: clients as unknown as Doc[],
  reports: savedReports as unknown as Doc[],
  notifications: notifications as unknown as Doc[],
}

/** Loads the starter catalogue. Runs on first start, or on demand (admin "Reset demo data"). */
export function seedDocs(force = false) {
  if (!force && sql.prepare('SELECT 1 FROM docs LIMIT 1').get()) return
  const insert = sql.prepare('INSERT INTO docs (kind, id, pos, data) VALUES (?, ?, ?, ?)')
  sql.exec('BEGIN')
  try {
    sql.exec('DELETE FROM docs')
    for (const kind of KINDS) seed[kind].forEach((d, i) => insert.run(kind, d.id, i, JSON.stringify(d)))
    sql.exec('COMMIT')
  } catch (e) {
    sql.exec('ROLLBACK')
    throw e
  }
}

export function allDocs<T = Doc>(kind: Kind): T[] {
  return sql
    .prepare('SELECT data FROM docs WHERE kind = ? ORDER BY pos')
    .all(kind)
    .map((r) => JSON.parse(r.data as string) as T)
}

/** Inserts (newest first) or replaces a document. With `create`, refuses to overwrite an existing id. */
export function putDoc(kind: Kind, doc: Doc, create = false): 'ok' | 'exists' {
  if (create && sql.prepare('SELECT 1 FROM docs WHERE kind = ? AND id = ?').get(kind, doc.id)) return 'exists'
  sql
    .prepare(
      `INSERT INTO docs (kind, id, pos, data)
       VALUES (?, ?, (SELECT COALESCE(MIN(pos), 0) - 1 FROM docs WHERE kind = ?), ?)
       ON CONFLICT (kind, id) DO UPDATE SET data = excluded.data`,
    )
    .run(kind, doc.id, kind, JSON.stringify(doc))
  return 'ok'
}
