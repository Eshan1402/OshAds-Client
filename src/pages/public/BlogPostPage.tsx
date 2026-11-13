import { ArrowLeft, FileX } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { postCategories, posts } from '@/data/posts'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatDate } from '@/utils/format'
import { EmptyState } from '@/components/ui/Feedback'
import { ButtonLink } from '@/components/ui/Button'
import { PageTransition } from '@/components/layout/PageTransition'
import { readMinutes } from './BlogPage'

/** Turns `[text](/link)` into router links; everything else stays plain text. */
function inline(text: string) {
  return text.split(/(\[[^\]]+\]\(\/[^)]*\))/).map((part, i): ReactNode => {
    const m = /^\[([^\]]+)\]\((\/[^)]*)\)$/.exec(part)
    return m ? <Link key={i} to={m[2]} className="font-medium text-accent-text underline underline-offset-2">{m[1]}</Link> : part
  })
}

function Body({ text }: { text: string }) {
  return (
    <div className="mt-8 space-y-5 text-[17px] leading-relaxed text-muted">
      {text.split('\n\n').map((block, i) => {
        if (block.startsWith('## ')) return <h2 key={i} className="pt-4 font-display text-2xl font-semibold text-fg">{block.slice(3)}</h2>
        if (block.startsWith('- ')) return <ul key={i} className="list-disc space-y-2 pl-5">{block.split('\n').map((li) => <li key={li}>{inline(li.slice(2))}</li>)}</ul>
        return <p key={i}>{inline(block)}</p>
      })}
    </div>
  )
}

export default function BlogPostPage() {
  const { slug } = useParams()
  const post = posts.find((p) => p.slug === slug)
  useDocumentTitle(post?.title ?? 'Article not found')
  useEffect(() => {
    const meta = document.querySelector('meta[name="description"]')
    const site = meta?.getAttribute('content') ?? ''
    if (post) meta?.setAttribute('content', post.excerpt)
    return () => meta?.setAttribute('content', site)
  }, [post])

  if (!post) {
    return (
      <div className="container-page py-20">
        <EmptyState icon={<FileX />} title="Article not found" description="This article may have moved or been removed." action={<ButtonLink to="/blog">Back to the blog</ButtonLink>} />
      </div>
    )
  }

  const category = postCategories.find((c) => c.slug === post.category)!
  const related = posts.filter((p) => p.category === post.category && p.slug !== post.slug).slice(0, 2)
  const jsonLd = { '@context': 'https://schema.org', '@type': 'Article', headline: post.title, description: post.excerpt, datePublished: post.date, author: { '@type': 'Organization', name: 'OshAds' } }

  return (
    <PageTransition>
      <article className="container-page max-w-2xl py-10 sm:py-14">
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
        <Link to="/blog" className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-muted hover:text-fg"><ArrowLeft className="size-4" aria-hidden /> All articles</Link>
        <p className="mt-6 text-sm font-medium text-accent-text"><Link to={`/blog?category=${category.slug}`} className="hover:underline">{category.name}</Link></p>
        <h1 className="mt-2 font-display text-3xl font-semibold leading-tight tracking-[-0.02em] text-fg sm:text-[42px]">{post.title}</h1>
        <p className="mt-3 text-sm text-subtle">OshAds Team · {formatDate(post.date)} · {readMinutes(post)} min read</p>
        <Body text={post.body} />
        {related.length > 0 && (
          <aside className="mt-12 border-t border-line pt-6">
            <h2 className="font-display text-lg font-semibold text-fg">Keep reading</h2>
            <ul className="mt-3 space-y-2">
              {related.map((p) => <li key={p.slug}><Link to={`/blog/${p.slug}`} className="text-accent-text hover:underline">{p.title}</Link></li>)}
            </ul>
          </aside>
        )}
      </article>
    </PageTransition>
  )
}
