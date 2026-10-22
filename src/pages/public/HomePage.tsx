import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { VelocityMarquee } from '@/components/motion/VelocityMarquee'
import { Hero } from './home/Hero'
import { PerksSection } from './home/Perks'
import { RecentlyViewed } from './home/RecentlyViewed'
import { ExpandingCTA, PinnedTrending, StoryScroll } from './home/ScrollSections'
import { CampaignTicker, CategoriesSection, ExploreSection, RecommendedSection } from './home/Sections'

/**
 * Section order is an engagement curve, not a sitemap:
 *  hook → proof → resume → personalise (invest) → momentum → reward → depth → breather → trust → next paths → B2B.
 * Every section either rewards the scroll or hands the visitor a reason to continue.
 */
export default function HomePage() {
  useDocumentTitle('Discover apps worth installing')
  return (
    <>
      {/* 1. Hook — what this is and why it’s worth your time */}
      <Hero />
      {/* 2. Proof — live activity says “people are here, right now” */}
      <CampaignTicker />
      {/* 3. Resume — returning visitors land back on what they cared about */}
      <RecentlyViewed />
      {/* 4. Personalise — a two-tap interaction early creates investment */}
      <RecommendedSection />
      {/* 5. Momentum — what’s hot, as a pinned, playful scroll moment */}
      <PinnedTrending />
      {/* 6. Reward — perks land after the visitor has seen apps they want */}
      <PerksSection />
      {/* 7. Depth — full, filterable browsing for engaged visitors */}
      <ExploreSection />
      {/* 8. Breather — kinetic type resets attention before the final stretch */}
      <VelocityMarquee words={['Discover', 'Understand', 'Install', 'Love it']} />
      {/* 9. Trust — how it works, for those still deciding */}
      <StoryScroll />
      {/* 10. Next paths — categories so the page never dead-ends */}
      <CategoriesSection />
      {/* 11. Business audience last */}
      <ExpandingCTA />
    </>
  )
}
