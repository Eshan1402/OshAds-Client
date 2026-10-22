import { memo, type CSSProperties, type ReactNode } from 'react'
import type { MobileApp } from '@/types'
import { cn } from '@/utils/cn'
import { DynamicIcon } from '@/components/ui/DynamicIcon'

/**
 * Procedurally rendered in-app screen used for store-style screenshots and
 * device mockups. Everything is sized in `em` against a container-relative font
 * size, so one component renders crisply from 120px thumbnails to full size.
 * Replace with real uploaded screenshots once the CMS/API provides them.
 */
type ScreenApp = Pick<MobileApp, 'name' | 'icon' | 'colors' | 'archetype' | 'features' | 'category'> &
  Partial<Pick<MobileApp, 'screenshots' | 'screenshotImages' | 'website' | 'iconImage'>>

const ink = '#0F1420'
const soft = '#667085'

function Bar({ w, h = 0.55, c = '#E4E7EC', r = 0.3, style }: { w: string; h?: number; c?: string; r?: number; style?: CSSProperties }) {
  return <div style={{ width: w, height: `${h}em`, background: c, borderRadius: `${r}em`, ...style }} />
}

function StatusBar({ dark }: { dark?: boolean }) {
  const c = dark ? '#fff' : ink
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.9em 1.6em 0.4em', color: c, fontSize: '0.85em', fontWeight: 600 }}>
      <span>9:41</span>
      <span style={{ display: 'flex', gap: '0.3em', alignItems: 'center' }}>
        <span style={{ width: '1.1em', height: '0.6em', borderRadius: '0.15em', border: `0.1em solid ${c}`, opacity: 0.9 }} />
        <span style={{ width: '0.5em', height: '0.5em', borderRadius: 99, background: c }} />
      </span>
    </div>
  )
}

function TabBar({ color, dark, active = 0 }: { color: string; dark?: boolean; active?: number }) {
  return (
    <div
      style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: '4.2em', display: 'flex', justifyContent: 'space-around', alignItems: 'center',
        background: dark ? 'rgba(10,13,20,0.85)' : 'rgba(255,255,255,0.92)', borderTop: `0.06em solid ${dark ? 'rgba(255,255,255,0.08)' : '#EEF0F4'}`, paddingBottom: '0.6em',
      }}
    >
      {[0, 1, 2, 3].map((i) => (
        <span key={i} style={{ width: '1.3em', height: '1.3em', borderRadius: '0.4em', background: i === active ? color : dark ? 'rgba(255,255,255,0.18)' : '#D0D5DD' }} />
      ))}
    </div>
  )
}

function Header({ title, color, dark }: { title: string; color: string; dark?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6em 1.4em 0.8em' }}>
      <div>
        <div style={{ fontSize: '0.7em', color: dark ? 'rgba(255,255,255,0.55)' : soft, fontWeight: 500 }}>Good evening</div>
        <div style={{ fontSize: '1.35em', fontWeight: 800, color: dark ? '#fff' : ink, letterSpacing: '-0.02em', lineHeight: 1.15 }}>{title}</div>
      </div>
      <span style={{ width: '2.2em', height: '2.2em', borderRadius: 99, background: `linear-gradient(140deg, ${color}, #FFB38A)` }} />
    </div>
  )
}

function Ledger({ app, v }: { app: ScreenApp; v: number }) {
  const [a, b] = app.colors
  const tx = [
    ['Groceries', '−$64.20', '#F59E0B'],
    ['Salary', '+$3,250.00', '#10B981'],
    ['Streaming', '−$12.99', '#EF4444'],
    ['Transport', '−$28.40', '#6366F1'],
    ['Coffee', '−$4.80', '#F97316'],
  ]
  const bars = [38, 62, 45, 80, 56, 92, 70]
  return (
    <>
      <Header title={v % 2 ? 'Insights' : app.name} color={a} />
      <div style={{ margin: '0 1.2em', padding: '1.2em', borderRadius: '1.1em', background: `linear-gradient(140deg, ${a}, ${b})`, color: '#fff', boxShadow: `0 0.8em 1.6em -0.6em ${b}` }}>
        <div style={{ fontSize: '0.7em', opacity: 0.85 }}>{v % 2 ? 'Spent this month' : 'Total balance'}</div>
        <div style={{ fontSize: '2em', fontWeight: 800, letterSpacing: '-0.03em', marginTop: '0.1em' }}>{v % 2 ? '$1,842' : '$12,480'}<span style={{ fontSize: '0.5em', opacity: 0.8 }}>.32</span></div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.45em', height: '3.2em', marginTop: '0.8em' }}>
          {bars.map((h, i) => (
            <span key={i} style={{ flex: 1, height: `${(v % 2 ? 100 - h : h)}%`, background: i === 5 ? '#fff' : 'rgba(255,255,255,0.35)', borderRadius: '0.25em' }} />
          ))}
        </div>
      </div>
      <div style={{ padding: '1.1em 1.4em 0.5em', fontSize: '0.85em', fontWeight: 700, color: ink }}>Recent activity</div>
      <div style={{ padding: '0 1.2em', display: 'flex', flexDirection: 'column', gap: '0.55em' }}>
        {tx.slice(v % 2, (v % 2) + 4).map(([n, amt, c]) => (
          <div key={n} style={{ display: 'flex', alignItems: 'center', gap: '0.7em', background: '#fff', borderRadius: '0.8em', padding: '0.7em', boxShadow: '0 0.1em 0.3em rgba(16,24,40,0.06)' }}>
            <span style={{ width: '2em', height: '2em', borderRadius: '0.6em', background: `${c}22`, display: 'grid', placeItems: 'center' }}>
              <span style={{ width: '0.8em', height: '0.8em', borderRadius: 99, background: c }} />
            </span>
            <span style={{ flex: 1, fontSize: '0.8em', fontWeight: 600, color: ink }}>{n}</span>
            <span style={{ fontSize: '0.8em', fontWeight: 700, color: amt.startsWith('+') ? '#079455' : ink }}>{amt}</span>
          </div>
        ))}
      </div>
    </>
  )
}

function Grid({ app, v }: { app: ScreenApp; v: number }) {
  const [a, b] = app.colors
  const tints = ['#FDE68A', '#BFDBFE', '#FBCFE8', '#BBF7D0', '#DDD6FE', '#FED7AA']
  return (
    <>
      <Header title={app.name} color={a} />
      <div style={{ margin: '0 1.2em', height: '2.6em', borderRadius: '0.8em', background: '#fff', border: '0.06em solid #E4E7EC', display: 'flex', alignItems: 'center', padding: '0 0.9em', gap: '0.5em' }}>
        <span style={{ width: '0.9em', height: '0.9em', borderRadius: 99, border: `0.15em solid ${soft}` }} />
        <Bar w="45%" h={0.5} />
      </div>
      <div style={{ display: 'flex', gap: '0.45em', padding: '0.9em 1.2em 0.7em', overflow: 'hidden' }}>
        {['For you', 'Deals', 'New', 'Saved'].map((t, i) => (
          <span key={t} style={{ flexShrink: 0, fontSize: '0.68em', fontWeight: 600, padding: '0.45em 0.9em', borderRadius: 99, background: i === v % 4 ? a : '#fff', color: i === v % 4 ? '#fff' : ink, border: '0.08em solid #E4E7EC' }}>{t}</span>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.7em', padding: '0 1.2em' }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ background: '#fff', borderRadius: '0.9em', padding: '0.5em', boxShadow: '0 0.1em 0.3em rgba(16,24,40,0.06)' }}>
            <div style={{ height: '6.2em', borderRadius: '0.6em', background: `linear-gradient(150deg, ${tints[(i + v) % tints.length]}, ${i === 0 ? a : tints[(i + v + 2) % tints.length]})`, position: 'relative' }}>
              {i === 0 && <span style={{ position: 'absolute', top: '0.4em', left: '0.4em', fontSize: '0.6em', fontWeight: 800, color: '#fff', background: b, padding: '0.2em 0.5em', borderRadius: 99 }}>−30%</span>}
            </div>
            <Bar w="80%" h={0.45} style={{ marginTop: '0.55em' }} />
            <div style={{ fontSize: '0.78em', fontWeight: 800, color: ink, marginTop: '0.35em' }}>${[24, 58, 129, 17][(i + v) % 4]}.00</div>
          </div>
        ))}
      </div>
    </>
  )
}

function Game({ app, v }: { app: ScreenApp; v: number }) {
  const [a, b] = app.colors
  return (
    <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(120% 70% at 50% 20%, ${a}, ${b} 55%, #07060F)`, color: '#fff' }}>
      <StatusBar dark />
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4em 1.2em', fontSize: '0.75em', fontWeight: 700 }}>
        <span style={{ background: 'rgba(0,0,0,0.3)', padding: '0.35em 0.7em', borderRadius: 99 }}>◆ 2,450</span>
        <span style={{ background: 'rgba(0,0,0,0.3)', padding: '0.35em 0.7em', borderRadius: 99 }}>Lv {12 + v * 7}</span>
      </div>
      <div style={{ position: 'relative', height: '22em', display: 'grid', placeItems: 'center' }}>
        {[13, 10, 7].map((s, i) => (
          <span key={s} style={{ position: 'absolute', width: `${s}em`, height: `${s}em`, borderRadius: v % 2 ? '2.2em' : 99, border: `0.12em solid rgba(255,255,255,${0.12 + i * 0.1})`, transform: `rotate(${v * 18 + i * 12}deg)` }} />
        ))}
        <span style={{ width: '5.5em', height: '5.5em', borderRadius: '1.6em', background: 'rgba(255,255,255,0.14)', display: 'grid', placeItems: 'center', backdropFilter: 'blur(4px)' }}>
          <DynamicIcon name={app.icon} style={{ width: '2.8em', height: '2.8em' }} strokeWidth={1.8} />
        </span>
      </div>
      <div style={{ textAlign: 'center', padding: '0 1.5em' }}>
        <div style={{ fontSize: '1.6em', fontWeight: 800, letterSpacing: '-0.02em' }}>{app.features[v % app.features.length]?.title ?? app.name}</div>
        <div style={{ fontSize: '0.75em', opacity: 0.7, marginTop: '0.3em' }}>{app.features[v % app.features.length]?.description}</div>
      </div>
      <div style={{ margin: '1.6em 2.2em 0', height: '3.2em', borderRadius: '1em', background: '#fff', color: b, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: '0.95em', boxShadow: '0 0.6em 1.4em rgba(0,0,0,0.35)' }}>
        {v % 2 ? 'Continue' : 'Play now'}
      </div>
      <div style={{ margin: '1.2em 2.2em 0', height: '0.5em', borderRadius: 99, background: 'rgba(255,255,255,0.2)' }}>
        <div style={{ width: `${45 + v * 9}%`, height: '100%', borderRadius: 99, background: '#fff' }} />
      </div>
    </div>
  )
}

function List({ app, v }: { app: ScreenApp; v: number }) {
  const [a] = app.colors
  const items = ['Review Q4 roadmap', 'Call with design team', 'Draft weekly update', 'Prepare workshop slides', 'Inbox zero', 'Plan tomorrow']
  return (
    <>
      <Header title={v % 2 ? 'This week' : 'Today'} color={a} />
      <div style={{ margin: '0 1.2em 0.9em', padding: '0.9em 1em', borderRadius: '0.9em', background: `${a}18`, display: 'flex', alignItems: 'center', gap: '0.8em' }}>
        <svg viewBox="0 0 36 36" style={{ width: '2.6em', height: '2.6em' }}>
          <circle cx="18" cy="18" r="15" fill="none" stroke="#E4E7EC" strokeWidth="4" />
          <circle cx="18" cy="18" r="15" fill="none" stroke={a} strokeWidth="4" strokeDasharray={`${60 + v * 6} 100`} strokeLinecap="round" transform="rotate(-90 18 18)" pathLength="100" />
        </svg>
        <div>
          <div style={{ fontSize: '0.85em', fontWeight: 800, color: ink }}>{4 + v} of 7 done</div>
          <div style={{ fontSize: '0.68em', color: soft }}>{app.features[v % app.features.length]?.title}</div>
        </div>
      </div>
      <div style={{ padding: '0 1.2em', display: 'flex', flexDirection: 'column', gap: '0.5em' }}>
        {items.slice(v % 2, (v % 2) + 5).map((t, i) => {
          const done = i < 2
          return (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '0.7em', background: '#fff', borderRadius: '0.75em', padding: '0.75em', boxShadow: '0 0.1em 0.3em rgba(16,24,40,0.06)' }}>
              <span style={{ width: '1.2em', height: '1.2em', borderRadius: '0.35em', border: `0.13em solid ${done ? a : '#D0D5DD'}`, background: done ? a : 'transparent' }} />
              <span style={{ flex: 1, fontSize: '0.78em', fontWeight: 600, color: done ? '#98A2B3' : ink, textDecoration: done ? 'line-through' : 'none' }}>{t}</span>
              <span style={{ fontSize: '0.62em', fontWeight: 600, color: soft }}>{['9:00', '10:30', '13:00', '15:15', '16:40', '18:00'][i]}</span>
            </div>
          )
        })}
      </div>
    </>
  )
}

function Media({ app, v }: { app: ScreenApp; v: number }) {
  const [a, b] = app.colors
  const posters = ['#F59E0B', '#6366F1', '#EC4899', '#14B8A6', '#EF4444', '#84CC16']
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#0B0B12', color: '#fff' }}>
      <StatusBar dark />
      <div style={{ margin: '0.4em 1.1em 0', height: '15em', borderRadius: '1.1em', background: `linear-gradient(160deg, ${a}, ${b} 60%, #0B0B12)`, position: 'relative', overflow: 'hidden' }}>
        <span style={{ position: 'absolute', right: '-2em', top: '-2em', width: '10em', height: '10em', borderRadius: 99, background: 'rgba(255,255,255,0.12)' }} />
        <div style={{ position: 'absolute', left: '1em', bottom: '1em', right: '1em' }}>
          <div style={{ fontSize: '0.6em', fontWeight: 700, letterSpacing: '0.1em', opacity: 0.8 }}>{v % 2 ? 'NEW THIS WEEK' : 'FEATURED'}</div>
          <div style={{ fontSize: '1.3em', fontWeight: 800, letterSpacing: '-0.02em', marginTop: '0.2em' }}>{app.features[v % app.features.length]?.title}</div>
          <div style={{ display: 'flex', gap: '0.5em', marginTop: '0.7em' }}>
            <span style={{ fontSize: '0.7em', fontWeight: 800, background: '#fff', color: '#0B0B12', padding: '0.5em 1.1em', borderRadius: 99 }}>▶ Play</span>
            <span style={{ fontSize: '0.7em', fontWeight: 700, background: 'rgba(255,255,255,0.18)', padding: '0.5em 1em', borderRadius: 99 }}>+ List</span>
          </div>
        </div>
      </div>
      {[0, 1].map((row) => (
        <div key={row}>
          <div style={{ padding: '1em 1.2em 0.5em', fontSize: '0.8em', fontWeight: 700 }}>{row ? 'Because you watched' : 'Continue'}</div>
          <div style={{ display: 'flex', gap: '0.55em', padding: '0 1.2em', overflow: 'hidden' }}>
            {[0, 1, 2, 3].map((i) => (
              <span key={i} style={{ flexShrink: 0, width: '5.4em', height: row ? '7.6em' : '4.2em', borderRadius: '0.6em', background: `linear-gradient(160deg, ${posters[(i + v + row * 2) % posters.length]}, #1D1D2B)` }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function Rings({ app, v }: { app: ScreenApp; v: number }) {
  const [a, b] = app.colors
  const rings = [
    [a, 78 - v * 5],
    ['#6366F1', 62 + v * 4],
    ['#F59E0B', 44 + v * 6],
  ] as const
  return (
    <>
      <Header title={app.features[v % app.features.length]?.title ?? 'Today'} color={a} />
      <div style={{ display: 'grid', placeItems: 'center', padding: '0.4em 0 0.8em' }}>
        <svg viewBox="0 0 120 120" style={{ width: '13em', height: '13em' }}>
          {rings.map(([c, p], i) => {
            const r = 50 - i * 13
            return (
              <g key={i}>
                <circle cx="60" cy="60" r={r} fill="none" stroke={`${c}26`} strokeWidth="10" />
                <circle cx="60" cy="60" r={r} fill="none" stroke={c} strokeWidth="10" strokeLinecap="round" pathLength="100" strokeDasharray={`${p} 100`} transform="rotate(-90 60 60)" />
              </g>
            )
          })}
        </svg>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.55em', padding: '0 1.2em' }}>
        {[['Active', `${32 + v * 4}m`], ['Streak', `${9 + v}d`], ['Score', `${82 + v}`]].map(([k, val]) => (
          <div key={k} style={{ background: '#fff', borderRadius: '0.8em', padding: '0.7em', textAlign: 'center', boxShadow: '0 0.1em 0.3em rgba(16,24,40,0.06)' }}>
            <div style={{ fontSize: '1.05em', fontWeight: 800, color: ink }}>{val}</div>
            <div style={{ fontSize: '0.62em', color: soft, fontWeight: 600 }}>{k}</div>
          </div>
        ))}
      </div>
      <div style={{ margin: '0.8em 1.2em 0', padding: '0.9em', borderRadius: '0.9em', background: `linear-gradient(140deg, ${a}, ${b})`, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.7em' }}>
        <span style={{ width: '2.2em', height: '2.2em', borderRadius: '0.7em', background: 'rgba(255,255,255,0.22)', display: 'grid', placeItems: 'center' }}>
          <DynamicIcon name={app.icon} style={{ width: '1.2em', height: '1.2em' }} />
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.8em', fontWeight: 800 }}>Next session</div>
          <div style={{ fontSize: '0.65em', opacity: 0.85 }}>{app.features[(v + 1) % app.features.length]?.description}</div>
        </div>
      </div>
    </>
  )
}

function MapScreen({ app, v }: { app: ScreenApp; v: number }) {
  const [a, b] = app.colors
  return (
    <>
      <div style={{ position: 'absolute', inset: 0, background: '#EAF2F4' }}>
        <svg viewBox="0 0 100 200" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <path key={i} d={`M${-10 + i * 12},0 L${20 + i * 9},200`} stroke="#fff" strokeWidth="2.2" />
          ))}
          {Array.from({ length: 10 }).map((_, i) => (
            <path key={`h${i}`} d={`M0,${i * 22 + 6} L100,${i * 22 + 18}`} stroke="#fff" strokeWidth="1.6" />
          ))}
          <path d="M18,150 C30,120 60,130 55,95 S70,50 82,38" fill="none" stroke={a} strokeWidth="3" strokeLinecap="round" strokeDasharray={v % 2 ? '5 4' : undefined} />
          <circle cx="18" cy="150" r="3.5" fill={b} />
          <circle cx="82" cy="38" r="4.5" fill={a} stroke="#fff" strokeWidth="1.5" />
        </svg>
      </div>
      <StatusBar />
      <div style={{ position: 'absolute', left: '1.1em', right: '1.1em', top: '3em', height: '2.6em', borderRadius: '0.9em', background: '#fff', boxShadow: '0 0.3em 0.8em rgba(16,24,40,0.12)', display: 'flex', alignItems: 'center', padding: '0 0.9em', gap: '0.6em' }}>
        <span style={{ width: '0.7em', height: '0.7em', borderRadius: 99, background: a }} />
        <span style={{ fontSize: '0.75em', fontWeight: 600, color: ink }}>{['Lisbon → Porto', 'SYD → MEL · Fri', 'Kyoto day 2', 'Barcelona'][v % 4]}</span>
      </div>
      <div style={{ position: 'absolute', left: '1.1em', right: '1.1em', bottom: '5em', borderRadius: '1.1em', background: '#fff', padding: '1em', boxShadow: '0 0.5em 1.4em rgba(16,24,40,0.16)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div style={{ fontSize: '1.1em', fontWeight: 800, color: ink }}>{app.features[v % app.features.length]?.title}</div>
          <div style={{ fontSize: '0.75em', fontWeight: 800, color: b }}>{['$148', '2h 40m', '12 stops', '$89'][v % 4]}</div>
        </div>
        <div style={{ fontSize: '0.68em', color: soft, marginTop: '0.25em' }}>{app.features[v % app.features.length]?.description}</div>
        <div style={{ marginTop: '0.8em', height: '2.6em', borderRadius: '0.8em', background: `linear-gradient(140deg, ${a}, ${b})`, color: '#fff', display: 'grid', placeItems: 'center', fontSize: '0.78em', fontWeight: 800 }}>View itinerary</div>
      </div>
    </>
  )
}

function Chat({ app, v }: { app: ScreenApp; v: number }) {
  const [a, b] = app.colors
  const msgs: Array<[boolean, string]> = [
    [true, 'Make this email sound friendlier'],
    [false, 'Hi Sam — thanks so much for the quick turnaround! I’ve looked through the draft and it’s looking great.'],
    [true, 'Now summarise the thread in 3 bullets'],
    [false, '• Launch moved to Tuesday\n• Budget approved\n• Sam owns the final QA'],
  ]
  return (
    <>
      <Header title={app.features[v % app.features.length]?.title ?? app.name} color={a} />
      <div style={{ padding: '0 1.1em', display: 'flex', flexDirection: 'column', gap: '0.6em' }}>
        {msgs.slice(v % 2 ? 2 : 0).concat(msgs.slice(0, v % 2 ? 2 : 0)).map(([me, text], i) => (
          <div
            key={i}
            style={{
              alignSelf: me ? 'flex-end' : 'flex-start', maxWidth: '82%', whiteSpace: 'pre-line', fontSize: '0.74em', lineHeight: 1.45, padding: '0.7em 0.9em',
              borderRadius: me ? '1em 1em 0.25em 1em' : '1em 1em 1em 0.25em',
              background: me ? `linear-gradient(140deg, ${a}, ${b})` : '#fff', color: me ? '#fff' : ink,
              boxShadow: me ? 'none' : '0 0.1em 0.3em rgba(16,24,40,0.08)',
            }}
          >
            {text}
          </div>
        ))}
      </div>
      <div style={{ position: 'absolute', left: '1.1em', right: '1.1em', bottom: '5em', height: '2.8em', borderRadius: 99, background: '#fff', border: '0.06em solid #E4E7EC', display: 'flex', alignItems: 'center', padding: '0 0.4em 0 1em', gap: '0.5em' }}>
        <Bar w="55%" h={0.5} />
        <span style={{ marginLeft: 'auto', width: '2.1em', height: '2.1em', borderRadius: 99, background: a }} />
      </div>
    </>
  )
}

const renderers: Record<MobileApp['archetype'], (p: { app: ScreenApp; v: number }) => ReactNode> = {
  ledger: Ledger,
  grid: Grid,
  game: Game,
  list: List,
  media: Media,
  rings: Rings,
  map: MapScreen,
  chat: Chat,
}

const darkArchetypes = new Set(['game', 'media'])

export const AppScreen = memo(function AppScreen({
  app,
  variant = 0,
  className,
}: {
  app: ScreenApp
  variant?: number
  className?: string
}) {
  // Real brands without screenshots get a plain brand card, never an invented app UI.
  if (app.screenshots === 0 && !app.screenshotImages?.length) return <BrandSplash app={app} className={className} />
  const Render = renderers[app.archetype]
  const dark = darkArchetypes.has(app.archetype)
  const fullBleed = dark || app.archetype === 'map'
  return (
    <div className={cn('@container relative h-full w-full overflow-hidden', className)} aria-hidden data-decorative>
      <div
        className="absolute inset-0 select-none text-[4.15cqw] leading-tight"
        style={{ background: dark ? '#0B0B12' : '#F6F7F9', fontFamily: 'Inter, system-ui, sans-serif' }}
      >
        {!fullBleed && <StatusBar />}
        <Render app={app} v={variant} />
        <TabBar color={app.colors[0]} dark={dark} active={variant % 4} />
      </div>
    </div>
  )
})

function BrandSplash({ app, className }: { app: ScreenApp; className?: string }) {
  const host = app.website ? new URL(app.website).hostname.replace(/^www\./, '') : ''
  return (
    <div
      className={cn('@container relative grid h-full w-full place-items-center overflow-hidden bg-surface text-fg', className)}
      aria-hidden
      data-decorative
    >
      <div className="grid justify-items-center gap-[4cqw] px-[8cqw] text-center">
        {app.iconImage ? (
          <img src={app.iconImage} alt="" className="size-[30cqw] rounded-[22%] bg-white object-cover shadow-md ring-1 ring-line" />
        ) : (
          <span className="grid size-[30cqw] place-items-center rounded-[22%] bg-surface-2">
            <DynamicIcon name={app.icon} className="size-[16cqw]" strokeWidth={2} />
          </span>
        )}
        <span className="text-[9cqw] font-bold leading-tight">{app.name}</span>
        {host && <span className="text-[5cqw] text-subtle">{host}</span>}
      </div>
    </div>
  )
}

/** Phone hardware frame around an AppScreen. */
export function PhoneFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'relative aspect-[9/19.5] rounded-[14%/6.5%] bg-ink-950 p-[3.2%] shadow-[0_0_0_1px_rgb(255_255_255/0.08)_inset,0_30px_60px_-20px_rgb(0_0_0/0.45)] ring-1 ring-black/40',
        className,
      )}
    >
      <div className="relative h-full w-full overflow-hidden rounded-[11.5%/5.3%] bg-black">
        {children}
        <span className="absolute left-1/2 top-[1.6%] z-10 h-[3.4%] w-[30%] -translate-x-1/2 rounded-full bg-black" aria-hidden />
      </div>
    </div>
  )
}
