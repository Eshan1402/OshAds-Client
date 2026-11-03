import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, ArrowLeft, CheckCircle2, ArrowRight, Eye, EyeOff, Lock, Mail, MailCheck } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { authService } from '@/services/authService'
import { Button, buttonClass } from '@/components/ui/Button'
import { Checkbox, Field, Input } from '@/components/ui/Form'
import { Logo } from '@/components/ui/Logo'
import { ThemeToggle } from '@/components/layout/ThemeToggle'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Google's "G" mark, as Google's sign-in branding asks for. */
function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}

export default function LoginPage() {
  useDocumentTitle('Manager login')
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const navState = location.state as { from?: string; signedOut?: boolean } | null
  const from = navState?.from ?? '/dashboard'
  const signedOut = !!navState?.signedOut

  const [mode, setMode] = useState<'login' | 'reset' | 'sent'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [showPw, setShowPw] = useState(false)
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({})
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  // When the server has Google sign-in set up, that's the only way in; password login is for local development.
  const [options, setOptions] = useState<{ google: boolean; domain: string } | null>(null)
  useEffect(() => {
    fetch('/api/auth/options')
      .then((r) => r.json())
      .then(setOptions)
      .catch(() => setOptions({ google: false, domain: '' }))
  }, [])
  const oauthError = new URLSearchParams(location.search).get('error')
  const shownError =
    formError ??
    (oauthError &&
      ({
        not_staff: `Use your @${options?.domain ?? 'oshads.com'} Google Workspace account. Personal Gmail accounts can’t sign in.`,
        cancelled: 'Google sign-in was cancelled.',
        expired: 'That sign-in took too long or was started in another tab. Try again.',
        not_configured: 'Google sign-in isn’t set up on the server yet. Sign in with your email and password for now.',
      }[oauthError] ??
        'Google couldn’t confirm your sign-in. Try again.'))

  if (isAuthenticated) return <Navigate to={from} replace />

  const emailError = !email ? 'Enter your work email.' : !EMAIL_RE.test(email) ? 'Enter a valid email address.' : undefined
  const pwError = !password ? 'Enter your password.' : password.length < 8 ? 'Passwords are at least 8 characters.' : undefined

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setTouched({ email: true, password: true })
    setFormError(null)
    if (mode === 'reset') {
      if (emailError) return
      setSubmitting(true)
      await authService.requestPasswordReset(email)
      setSubmitting(false)
      setMode('sent')
      return
    }
    if (emailError || pwError) return
    setSubmitting(true)
    try {
      await login(email, password, remember)
      navigate(from, { replace: true })
    } catch (err) {
      setFormError((err as Error).message)
      setSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <BrandPanel />
      <div className="relative flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Link to="/" className="lg:invisible" aria-label="OshAds home"><Logo /></Link>
          <div className="flex items-center gap-2">
            <Link to="/" className="text-sm font-medium text-muted hover:text-fg">Back to site</Link>
            <ThemeToggle />
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <AnimatePresence mode="wait">
            {mode === 'sent' ? (
              <motion.div key="sent" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="text-center">
                <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-success-soft text-success"><MailCheck className="size-6" /></span>
                <h1 className="mt-5 font-display text-2xl font-bold text-fg">Check your inbox</h1>
                <p className="mt-2 text-sm text-muted">If an account exists for <span className="font-medium text-fg">{email}</span>, a reset link is on its way. It expires in 30 minutes.</p>
                <Button variant="outline" className="mt-6" leftIcon={<ArrowLeft className="size-4" />} onClick={() => setMode('login')}>Back to sign in</Button>
              </motion.div>
            ) : (
              <motion.div key={mode} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
                <h1 className="font-display text-3xl font-bold tracking-tight text-fg">{mode === 'login' ? 'Welcome back' : 'Reset your password'}</h1>
                <p className="mt-2 text-sm text-muted">
                  {mode === 'login' ? 'Sign in to manage campaigns, clients and performance.' : 'Enter your work email and we’ll send you a secure reset link.'}
                </p>

                {signedOut && mode === 'login' && !shownError && (
                  <div role="status" className="mt-6 flex items-start gap-2.5 rounded-xl border border-success/25 bg-success-soft p-3 text-sm text-success">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
                    You’ve been signed out securely. Sign in again to continue.
                  </div>
                )}

                <AnimatePresence>
                  {shownError && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div role="alert" className="mt-6 flex items-start gap-2.5 rounded-xl border border-danger/25 bg-danger-soft p-3 text-sm text-danger">
                        <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                        {shownError}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {options && mode === 'login' && (
                  <div className="mt-6">
                    <a href="/api/auth/google" className={buttonClass({ variant: 'outline', size: 'lg', className: 'w-full gap-3' })}>
                      <GoogleMark /> Continue with Google
                    </a>
                    <p className="mt-3 text-center text-xs text-subtle">Only @{options.domain} work accounts can sign in.</p>
                    {!options.google && (
                      <div className="mt-6 flex items-center gap-3 text-xs text-subtle" aria-hidden>
                        <span className="h-px flex-1 bg-line" /> or use your password <span className="h-px flex-1 bg-line" />
                      </div>
                    )}
                  </div>
                )}

                {options && !options.google && (
                <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
                  <Field label="Work email" error={touched.email ? emailError : undefined} required>
                    {({ id, describedBy, invalid }) => (
                      <Input id={id} aria-describedby={describedBy} invalid={invalid} type="email" autoComplete="username" inputSize="lg" leftIcon={<Mail />} placeholder="you@oshads.com" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => setTouched((t) => ({ ...t, email: true }))} />
                    )}
                  </Field>
                  {mode === 'login' && (
                    <Field label="Password" error={touched.password ? pwError : undefined} required>
                      {({ id, describedBy, invalid }) => (
                        <Input
                          id={id}
                          aria-describedby={describedBy}
                          invalid={invalid}
                          type={showPw ? 'text' : 'password'}
                          autoComplete="current-password"
                          inputSize="lg"
                          leftIcon={<Lock />}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                          rightSlot={
                            <button type="button" onClick={() => setShowPw((s) => !s)} className="grid size-10 place-items-center rounded-lg text-subtle hover:text-fg" aria-label={showPw ? 'Hide password' : 'Show password'}>
                              {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </button>
                          }
                        />
                      )}
                    </Field>
                  )}
                  {mode === 'login' && (
                    <div className="flex items-center justify-between">
                      <Checkbox checked={remember} onChange={setRemember} label={<span className="text-[13px] font-normal text-muted">Remember me for 14 days</span>} />
                      <button type="button" onClick={() => { setMode('reset'); setFormError(null) }} className="text-[13px] font-semibold text-accent-text hover:underline">
                        Forgot password?
                      </button>
                    </div>
                  )}
                  <Button type="submit" size="lg" className="w-full" loading={submitting} rightIcon={<ArrowRight className="size-4" />}>
                    {mode === 'login' ? 'Sign in' : 'Send reset link'}
                  </Button>
                  {mode === 'reset' && (
                    <Button variant="ghost" className="w-full" onClick={() => setMode('login')} leftIcon={<ArrowLeft className="size-4" />}>Back to sign in</Button>
                  )}
                </form>
                )}

              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <p className="text-center text-xs text-subtle">Protected by session timeouts and role-based access. Need access? Ask your OshAds admin.</p>
      </div>
    </div>
  )
}

function BrandPanel() {
  const points = [22, 28, 26, 34, 31, 40, 38, 47, 45, 55, 52, 63, 61, 72]
  const w = 420
  const h = 140
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${(i / (points.length - 1)) * w},${h - (p / 80) * h}`).join(' ')
  return (
    <div className="relative hidden overflow-hidden bg-ink-950 p-10 text-white lg:flex lg:flex-col">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-[0.08] [filter:invert(1)]" aria-hidden />
      <div className="pointer-events-none absolute -left-20 top-1/3 size-[560px] rounded-full bg-[radial-gradient(circle,rgb(255_107_26/0.35),transparent_60%)]" aria-hidden />
      <div className="pointer-events-none absolute -right-32 -top-20 size-[420px] rounded-full bg-[radial-gradient(circle,rgb(108_99_240/0.25),transparent_60%)]" aria-hidden />
      <Link to="/" className="relative" aria-label="OshAds home">
        <span className="dark"><Logo /></span>
      </Link>
      <div className="relative my-auto max-w-lg">
        <h2 className="font-display text-4xl font-bold leading-tight tracking-[-0.03em]">
          Every campaign, every install, <span className="text-brand-400">in real time.</span>
        </h2>
        <p className="mt-4 text-white/60">The OshAds manager console — owned traffic, transparent attribution and the controls to optimise it.</p>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.7 }} className="mt-10 rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur" aria-hidden>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-white/50">Downloads · last 14 days</p>
              <p className="num mt-1 font-display text-3xl font-bold">18,452 <span className="text-sm font-semibold text-emerald-400">+21.3%</span></p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
              <span className="size-1.5 animate-pulse-dot rounded-full bg-emerald-400 text-emerald-400" /> Live
            </span>
          </div>
          <svg viewBox={`0 0 ${w} ${h}`} className="mt-4 h-36 w-full overflow-visible">
            <defs>
              <linearGradient id="login-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#1B3FD0" stopOpacity="0.35" />
                <stop offset="1" stopColor="#1B3FD0" stopOpacity="0" />
              </linearGradient>
            </defs>
            <motion.path d={`${d} L${w},${h} L0,${h} Z`} fill="url(#login-fill)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 0.8 }} />
            <motion.path d={d} fill="none" stroke="#3D7BFF" strokeWidth="2.5" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.4, duration: 1.6, ease: [0.16, 1, 0.3, 1] }} />
          </svg>
          <div className="mt-4 grid grid-cols-3 gap-3 border-t border-white/10 pt-4 text-xs">
            {[['Visitors', '124.6K'], ['CTR', '23.4%'], ['Conv.', '43.1%']].map(([k, v]) => (
              <div key={k}>
                <p className="text-white/45">{k}</p>
                <p className="num mt-0.5 text-sm font-semibold">{v}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
      <p className="relative text-xs text-white/40">© {new Date().getFullYear()} Oshads Media LLC · Driven by results.</p>
    </div>
  )
}
