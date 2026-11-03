/**
 * "Sign in with Google" for staff, limited to one Google Workspace domain (OpenID Connect, authorization-code flow).
 * Needs GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET; without them, email + password login stays on.
 */
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? ''
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? ''
export const STAFF_DOMAIN = (process.env.STAFF_DOMAIN ?? 'oshads.com').toLowerCase()
export const googleEnabled = () => !!(CLIENT_ID && CLIENT_SECRET)

export function authUrl(redirectUri: string, state: string, nonce: string) {
  const u = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  u.search = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    nonce,
    hd: STAFF_DOMAIN, // only a hint for Google's account picker; the domain is enforced in checkClaims
    prompt: 'select_account',
  }).toString()
  return u.toString()
}

/**
 * Swaps the one-time code for the ID token's claims. The token comes straight from Google's token endpoint over TLS,
 * so (per Google's OpenID docs) its signature needn't be re-checked; its claims still are, in checkClaims.
 */
export async function exchangeCode(code: string, redirectUri: string): Promise<Record<string, unknown>> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code, client_id: CLIENT_ID, client_secret: CLIENT_SECRET, redirect_uri: redirectUri, grant_type: 'authorization_code' }),
    signal: AbortSignal.timeout(10_000),
  })
  const body = (await res.json().catch(() => null)) as { id_token?: string } | null
  if (!res.ok || !body?.id_token) throw new Error('google_exchange_failed')
  return JSON.parse(Buffer.from(body.id_token.split('.')[1], 'base64url').toString())
}

/** Who signed in, or the reason they're refused. Only verified addresses on the staff domain get through. */
export function checkClaims(
  c: Record<string, unknown>,
  nonce: string,
  clientId = CLIENT_ID,
  now = Date.now() / 1000,
): { error: 'bad_token' | 'not_staff' } | { email: string; name: string } {
  const email = typeof c.email === 'string' ? c.email.toLowerCase() : ''
  if (c.iss !== 'https://accounts.google.com' && c.iss !== 'accounts.google.com') return { error: 'bad_token' }
  if (c.aud !== clientId || typeof c.exp !== 'number' || c.exp < now || c.nonce !== nonce) return { error: 'bad_token' }
  // hd is only present for Workspace accounts, so a personal Gmail can't pass even with a look-alike address.
  if (c.email_verified !== true || c.hd !== STAFF_DOMAIN || !email.endsWith(`@${STAFF_DOMAIN}`)) return { error: 'not_staff' }
  return { email, name: typeof c.name === 'string' && c.name.trim() ? c.name.trim().slice(0, 80) : email.split('@')[0] }
}
