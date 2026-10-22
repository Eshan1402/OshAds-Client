/**
 * Download clicks, confirmed conversions and Osh coins.
 *
 * Every Download click gets a click_id. The advertiser's tracker (AppsFlyer, Adjust, …) receives it through the
 * tracking link and calls our postback when the install happens; staff can also confirm by hand. A confirmed install
 * is a "download" on the dashboard and turns that wallet's pending coins for the app into spendable coins.
 * Coins are paid once per wallet per app; a wallet is an anonymous id kept in the visitor's browser (no login).
 */
import { randomBytes } from 'node:crypto'
import { sql } from './db'
import type { Visit } from './events'

export const REWARD_COINS = 20
const WALLET_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const validWallet = (id: unknown): id is string => typeof id === 'string' && WALLET_RE.test(id)

/** Records a Download click. Returns the click id and, for a wallet, whether coins are now pending for this app. */
export function recordClick(appId: string, visit: Visit | null, walletId: string | null, source: string) {
  const clickId = randomBytes(12).toString('base64url')
  const now = Date.now()
  const day = new Date(now).toISOString().slice(0, 10)
  if (visit) {
    // Bots get a working link but leave no trace in the numbers.
    sql
      .prepare('INSERT INTO clicks (click_id, ts, day, app_id, visitor, wallet_id, source, device, os, country) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(clickId, now, day, appId, visit.visitor, walletId, source, visit.device, visit.os, visit.country)
    sql
      .prepare("INSERT INTO events (ts, day, visitor, type, app_id, path, source, device, os, country) VALUES (?, ?, ?, 'download_click', ?, ?, ?, ?, ?, ?)")
      .run(now, day, visit.visitor, appId, `/app/${appId}`, source, visit.device, visit.os, visit.country)
  }
  let reward: 'pending' | 'confirmed' | null = null
  if (visit && walletId) {
    const existing = sql.prepare('SELECT status FROM rewards WHERE wallet_id = ? AND app_id = ?').get(walletId, appId) as { status: string } | undefined
    if (!existing) {
      sql
        .prepare("INSERT INTO rewards (wallet_id, app_id, click_id, coins, status, created_ts) VALUES (?, ?, ?, ?, 'pending', ?)")
        .run(walletId, appId, clickId, REWARD_COINS, now)
      reward = 'pending'
    } else if (existing.status === 'pending') {
      // A fresh click replaces the old one, so the latest install attempt is the one that confirms.
      sql.prepare("UPDATE rewards SET click_id = ? WHERE wallet_id = ? AND app_id = ? AND status = 'pending'").run(clickId, walletId, appId)
      reward = 'pending'
    } else if (existing.status === 'confirmed') reward = 'confirmed'
  }
  return { clickId, reward }
}

/** Records a confirmed install/usage for a click. Idempotent per (click, event). Returns false for unknown clicks. */
export function confirmConversion(clickId: string, event: string, payout: number, via: 'postback' | 'staff') {
  const click = sql.prepare('SELECT app_id FROM clicks WHERE click_id = ?').get(clickId) as { app_id: string } | undefined
  if (!click) return false
  const now = Date.now()
  sql
    .prepare('INSERT OR IGNORE INTO conversions (ts, day, click_id, app_id, event, payout, via) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(now, new Date(now).toISOString().slice(0, 10), clickId, click.app_id, event, payout, via)
  sql.prepare("UPDATE rewards SET status = 'confirmed', decided_ts = ? WHERE click_id = ? AND status = 'pending'").run(now, clickId)
  return true
}

export function rejectReward(id: number) {
  return sql.prepare("UPDATE rewards SET status = 'rejected', decided_ts = ? WHERE id = ? AND status = 'pending'").run(Date.now(), id).changes > 0
}

export function wallet(walletId: string) {
  const items = sql
    .prepare('SELECT app_id AS appId, coins, status, created_ts AS createdAt, decided_ts AS decidedAt FROM rewards WHERE wallet_id = ? ORDER BY created_ts DESC')
    .all(walletId)
    .map((r) => ({ appId: String(r.appId), coins: Number(r.coins), status: String(r.status), createdAt: Number(r.createdAt), decidedAt: r.decidedAt == null ? null : Number(r.decidedAt) }))
  const total = (s: string) => items.filter((i) => i.status === s).reduce((a, i) => a + i.coins, 0)
  return { balance: total('confirmed'), pending: total('pending'), items }
}

export function rewardsForReview(status: string) {
  return sql
    .prepare(
      `SELECT r.id, r.wallet_id AS walletId, r.app_id AS appId, r.click_id AS clickId, r.coins, r.status, r.created_ts AS createdAt, k.country, k.device
       FROM rewards r LEFT JOIN clicks k ON k.click_id = r.click_id WHERE r.status = ? ORDER BY r.created_ts DESC LIMIT 200`,
    )
    .all(status)
}

export const rewardClick = (id: number) => (sql.prepare('SELECT click_id FROM rewards WHERE id = ?').get(id) as { click_id: string } | undefined)?.click_id
