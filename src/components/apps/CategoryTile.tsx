import { ArrowRight } from 'lucide-react'
import { memo } from 'react'
import { Link } from 'react-router-dom'
import type { Category } from '@/types'
import { cn } from '@/utils/cn'
import { DynamicIcon } from '@/components/ui/DynamicIcon'

export const CategoryTile = memo(function CategoryTile({
  category,
  count,
  size = 'md',
}: {
  category: Category
  count?: number
  size?: 'md' | 'lg'
}) {
  const [a, b] = category.colors
  return (
    <Link
      to={`/categories/${category.slug}`}
      data-cursor="Open"
      className={cn(
        'group relative flex flex-col justify-between overflow-hidden rounded-[20px] glass p-4 transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-0.5 hover:border-transparent hover:shadow-lg',
        size === 'lg' ? 'min-h-40 sm:p-5' : 'min-h-32',
      )}
    >
      <span
        className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: `linear-gradient(150deg, ${a}, ${b})` }}
        aria-hidden
      />
      <span
        className="absolute -right-6 -top-6 size-24 rounded-full opacity-[0.14] transition-transform duration-500 group-hover:scale-150 group-hover:opacity-20"
        style={{ background: a }}
        aria-hidden
      />
      <span
        className="relative grid size-10 place-items-center rounded-xl text-white shadow-sm transition-transform duration-300 ease-[var(--ease-spring)] group-hover:rotate-[-8deg] group-hover:scale-110 group-hover:bg-white/20"
        style={{ background: `linear-gradient(145deg, ${a}, ${b})` }}
      >
        <DynamicIcon name={category.icon} className="size-5" strokeWidth={2.2} />
      </span>
      <span className="relative mt-4">
        <span className="flex items-center justify-between font-display text-[15px] font-bold text-fg transition-colors group-hover:text-white">
          {category.name}
          <ArrowRight className="size-4 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" aria-hidden />
        </span>
        {size === 'lg' ? (
          <span className="mt-1 line-clamp-2 block text-xs text-subtle transition-colors group-hover:text-white/80">{category.description}</span>
        ) : (
          count !== undefined && (
            <span className="num mt-0.5 block text-xs text-subtle transition-colors group-hover:text-white/80">{count} apps</span>
          )
        )}
      </span>
    </Link>
  )
})
