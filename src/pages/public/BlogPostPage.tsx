import { ArrowLeft, FileX } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { postCategories, posts } from '@/data/posts'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatDate } from '@/utils/format'
import { EmptyState } from '@/components/ui/Feedback'
import { ButtonLink } from '@/components/ui/Button'
import { PageTransition } from '@/components/layout/PageTransition'
import { Markdown } from '@/components/content/Markdown'
import { readMinutes } from './BlogPage'

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

  return (
    <PageTransition>
      <article className="container-page max-w-2xl py-10 sm:py-14">
        <Link to="/blog" className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-muted hover:text-fg"><ArrowLeft className="size-4" aria-hidden /> All articles</Link>
        <p className="mt-6 text-sm font-medium text-accent-text"><Link to={`/blog?category=${category.slug}`} className="hover:underline">{category.name}</Link></p>
        <h1 className="mt-2 font-display text-3xl font-semibold leading-tight tracking-[-0.02em] text-fg sm:text-[42px]">{post.title}</h1>
        <p className="mt-3 text-sm text-subtle">OshAds Team · {formatDate(post.date)} · {readMinutes(post)} min read</p>
        <Markdown text={post.body} className="mt-8" />
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
