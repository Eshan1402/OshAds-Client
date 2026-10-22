import { ArrowRight, BarChart3, BadgeCheck, Fingerprint, LineChart, ShieldCheck, Target, Users } from 'lucide-react'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { ButtonLink } from '@/components/ui/Button'
import { PageTransition, Reveal } from '@/components/layout/PageTransition'

const pillars = [
  { icon: <BadgeCheck className="size-5" />, title: 'Reviewed, not just listed', body: 'Every app is tested by our team for quality, privacy practices and honest marketing before it appears on OshAds.' },
  { icon: <ShieldCheck className="size-5" />, title: 'Official sources only', body: 'Every link opens the lender’s own website, App Store or Google Play listing. We never host app files or ask for credentials.' },
  { icon: <Fingerprint className="size-5" />, title: 'Privacy-first discovery', body: 'Personalisation runs on your device. No account, no cross-site tracking, no selling of personal data.' },
]

const forPublishers = [
  { icon: <Target className="size-5" />, title: 'High-intent, first-party traffic', body: 'Users arrive looking for apps — not interrupted by them. Better retention, lower fraud.' },
  { icon: <LineChart className="size-5" />, title: 'Real-time performance', body: 'Impressions, clicks, installs and conversion by campaign, geo and device — live.' },
  { icon: <BarChart3 className="size-5" />, title: 'Transparent reporting', body: 'Exportable reports and postbacks to AppsFlyer, Adjust, Branch, Singular and more.' },
  { icon: <Users className="size-5" />, title: 'Dedicated growth team', body: 'A campaign manager who optimises creatives, targeting and budgets with you.' },
]

export default function AboutPage() {
  useDocumentTitle('About')
  return (
    <PageTransition>
      <section className="container-page py-16 sm:py-24">
        <p className="eyebrow !text-accent-text">About OshAds</p>
        <h1 className="mt-3 max-w-3xl font-display text-4xl font-extrabold tracking-[-0.035em] text-fg sm:text-6xl">
          Creativity that converts. <span className="text-gradient-brand">Driven by results.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
          OshAds is a full-service advertising and digital growth partner, trusted by 300+ businesses over 15+ years. This is our first-party app discovery platform: where people find apps worth installing, and where great apps reach the people who will actually use them.
        </p>
      </section>

      <section id="trust" className="border-y border-line bg-surface py-16 sm:py-20" aria-labelledby="trust-title">
        <div className="container-page">
          <h2 id="trust-title" className="font-display text-3xl font-bold tracking-tight text-fg">How we review apps</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {pillars.map((p, i) => (
              <Reveal key={p.title} delay={i * 0.06}>
                <div className="h-full rounded-[20px] glass p-6">
                  <span className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent-text">{p.icon}</span>
                  <h3 className="mt-4 font-display text-lg font-bold text-fg">{p.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{p.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <p className="mt-6 max-w-3xl text-sm text-subtle">
            Advertising disclosure: apps labelled “Sponsored” are paid campaigns. Payment never affects ratings, which come directly from the public app stores.
          </p>
        </div>
      </section>

      <section id="advertisers" className="container-page py-16 sm:py-20" aria-labelledby="adv-title">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <p className="eyebrow !text-accent-text">For app publishers</p>
            <h2 id="adv-title" className="mt-3 font-display text-3xl font-bold tracking-tight text-fg sm:text-4xl">Grow with traffic you can trust</h2>
            <p className="mt-4 text-muted">Launch install, engagement and reactivation campaigns on CPI, CPA or CPC models with fraud filtering built in.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink to="/login" rightIcon={<ArrowRight className="size-4" />}>Partner login</ButtonLink>
              <a href="https://oshads.com" target="_blank" rel="noreferrer" className="inline-flex h-10 items-center rounded-[10px] border border-line-strong bg-surface px-4 text-sm font-semibold text-fg hover:bg-surface-2">Talk to the OshAds team ↗</a>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {forPublishers.map((p) => (
              <div key={p.title} className="rounded-[20px] glass p-5">
                <span className="text-accent-text">{p.icon}</span>
                <h3 className="mt-3 font-display font-bold text-fg">{p.title}</h3>
                <p className="mt-1 text-sm text-muted">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="privacy" className="container-page pb-20 text-sm text-muted">
        <div className="rounded-[20px] glass p-6">
          <h2 className="font-display text-lg font-bold text-fg">Privacy & terms</h2>
          <p className="mt-2 max-w-3xl">We store your theme, interests and recent searches only in your browser. Outbound store clicks are counted anonymously to attribute campaign performance. <span id="terms">Use of OshAds is subject to our standard terms of service.</span></p>
        </div>
      </section>
    </PageTransition>
  )
}
