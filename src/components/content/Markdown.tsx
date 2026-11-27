import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/utils/cn'

/** Turns `[text](/link)` into router links; everything else stays plain text. */
function inline(text: string) {
  return text.split(/(\[[^\]]+\]\(\/[^)]*\))/).map((part, i): ReactNode => {
    const m = /^\[([^\]]+)\]\((\/[^)]*)\)$/.exec(part)
    return m ? <Link key={i} to={m[2]} className="font-medium text-accent-text underline underline-offset-2">{m[1]}</Link> : part
  })
}

/** The site's light markdown (## headings, blank-line paragraphs, - lists, internal links), used by the blog and category guides. */
export function Markdown({ text, className }: { text: string; className?: string }) {
  return (
    <div className={cn('space-y-5 text-[17px] leading-relaxed text-muted', className)}>
      {text.split('\n\n').map((block, i) => {
        if (block.startsWith('## ')) return <h2 key={i} className="pt-4 font-display text-2xl font-semibold text-fg">{block.slice(3)}</h2>
        if (block.startsWith('- ')) return <ul key={i} className="list-disc space-y-2 pl-5">{block.split('\n').map((li, j) => <li key={j}>{inline(li.slice(2))}</li>)}</ul>
        return <p key={i}>{inline(block)}</p>
      })}
    </div>
  )
}
