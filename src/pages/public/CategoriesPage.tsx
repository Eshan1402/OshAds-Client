import { useParams } from 'react-router-dom'
import { categories, categoryBySlug } from '@/data/categories'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useQuery } from '@/hooks/useQuery'
import { appsService } from '@/services/appsService'
import type { CategorySlug } from '@/types'
import { CategoryTile } from '@/components/apps/CategoryTile'
import { PageTransition } from '@/components/layout/PageTransition'
import { useStaggerReveal } from '@/hooks/useStaggerReveal'
import { useRef } from 'react'
import ExplorePage from './ExplorePage'
import NotFoundPage from './NotFoundPage'

export default function CategoriesPage() {
  const { slug } = useParams()
  useDocumentTitle(slug ? undefined : 'Categories')
  const { data } = useQuery('apps:list:all', () => appsService.list())
  const grid = useRef<HTMLDivElement>(null)
  useStaggerReveal(grid, '[data-reveal]', [slug])
  if (slug) {
    if (!categoryBySlug[slug as CategorySlug]) return <NotFoundPage />
    return <ExplorePage key={slug} fixedCategory={slug as CategorySlug} />
  }
  return (
    <PageTransition>
      <section className="container-page py-12 sm:py-16">
        <p className="eyebrow !text-accent-text">Categories</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-[-0.03em] text-fg sm:text-5xl">Browse by category</h1>
        <p className="mt-3 max-w-xl text-muted">Twelve curated categories. Every app inside has been reviewed for quality, privacy and honest marketing.</p>
        <div ref={grid} className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {categories.map((c) => (
            <div key={c.slug} data-reveal>
              <CategoryTile category={c} size="lg" count={data?.filter((a) => a.category === c.slug).length} />
            </div>
          ))}
        </div>
      </section>
    </PageTransition>
  )
}
