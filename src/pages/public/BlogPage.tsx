import { Flame, Gamepad2, ShieldCheck, Smartphone, Wallet } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { postCategories, posts, type Post, type PostCategory } from '@/data/posts'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useQuery } from '@/hooks/useQuery'
import { track } from '@/lib/track'
import { cn } from '@/utils/cn'
import { formatDate } from '@/utils/format'
import { PageTransition } from '@/components/layout/PageTransition'

const ICONS = { safety: ShieldCheck, money: Wallet, guides: Smartphone, games: Gamepad2 }
const nameOf = (c: PostCategory) => postCategories.find((p) => p.slug === c)!.name
const newest = [...posts].sort((a, b) => b.date.localeCompare(a.date))

export const readMinutes = (p: Post) => Math.max(1, Math.round(p.body.split(/\s+/).length / 200))

function PostCard({ post }: { post: Post }) {
  const Icon = ICONS[post.category]
  return (
    <Link to={`/blog/${post.slug}`} className="group flex flex-col rounded-[20px] border border-line bg-surface p-5 transition hover:-translate-y-0.5 hover:border-line-strong hover:shadow-md">
      <span className="flex items-center gap-2 text-xs font-medium text-accent-text">
        <span className="grid size-8 place-items-center rounded-lg bg-accent-soft"><Icon className="size-4" aria-hidden /></span>
        {nameOf(post.category)}
      </span>
      <h3 className="mt-4 font-display text-lg font-semibold leading-snug text-fg group-hover:text-accent-text">{post.title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{post.excerpt}</p>
      <p className="mt-4 text-xs text-subtle">{formatDate(post.date)} · {readMinutes(post)} min read</p>
    </Link>
  )
}

export default function BlogPage() {
  useDocumentTitle('Blog')
  const [params, setParams] = useSearchParams()
  const category = params.get('category')
  const active = postCategories.some((c) => c.slug === category) ? (category as PostCategory) : null
  const shown = active ? newest.filter((p) => p.category === active) : newest

  const { data: reads } = useQuery('blog:trending', async () => {
    const res = await fetch('/api/blog/trending')
    return res.ok ? ((await res.json()) as Array<{ slug: string; readers: number }>) : []
  })
  // Ranked by real readers this week. Until a post has any, the section isn't shown.
  const trending = (reads ?? []).flatMap((r) => posts.filter((p) => p.slug === r.slug)).slice(0, 4)

  const pick = (slug: PostCategory | null) => {
    if (slug) track('filter', undefined, { label: `blog:${slug}` })
    setParams(slug ? { category: slug } : {}, { replace: true })
  }

  return (
    <PageTransition>
      <div className="container-page py-12 sm:py-16">
        <p className="eyebrow">OshAds blog</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-[-0.03em] text-fg sm:text-5xl">Know your apps</h1>
        <p className="mt-3 max-w-xl text-muted">Plain guides on staying safe, borrowing carefully, getting more from your phone, and beating your best game score.</p>

        {trending.length > 0 && (
          <section className="mt-10" aria-labelledby="trending-posts">
            <h2 id="trending-posts" className="flex items-center gap-2 font-display text-xl font-semibold text-fg">
              <Flame className="size-5 text-accent-text" aria-hidden /> Trending this week
            </h2>
            <ol className="mt-4 grid gap-3 sm:grid-cols-2">
              {trending.map((p, i) => (
                <li key={p.slug}>
                  <Link to={`/blog/${p.slug}`} className="flex h-full items-center gap-4 rounded-2xl border border-line bg-surface p-4 transition hover:border-line-strong">
                    <span className="num font-display text-3xl font-semibold text-accent-text">{i + 1}</span>
                    <span className="min-w-0">
                      <span className="block font-semibold leading-snug text-fg">{p.title}</span>
                      <span className="mt-0.5 block text-xs text-subtle">{nameOf(p.category)} · {readMinutes(p)} min read</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        )}

        <div className="mt-10 flex gap-2 overflow-x-auto pb-1 scrollbar-none" role="group" aria-label="Filter by category">
          {[{ slug: null, name: 'All' }, ...postCategories].map((c) => (
            <button
              key={c.name}
              type="button"
              aria-pressed={active === c.slug}
              onClick={() => pick(c.slug)}
              className={cn(
                'h-10 shrink-0 rounded-full border px-4 text-sm font-medium transition',
                active === c.slug ? 'border-transparent bg-fg text-bg' : 'border-line bg-surface text-muted hover:text-fg',
              )}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((p) => <PostCard key={p.slug} post={p} />)}
        </div>
      </div>
    </PageTransition>
  )
}
