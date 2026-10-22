import { cn } from '@/utils/cn'

/**
 * Fixed field of soft brand light behind the page. Glass surfaces need colour behind
 * them to read as glass; this gives every section something to refract.
 * Pure CSS and static: drifting blobs and a blended grain layer made every frame repaint the page.
 */
export function AmbientBackdrop({ subtle }: { subtle?: boolean }) {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div
        className={cn(
          'absolute -left-[12%] top-[8%] size-[58vmax] rounded-full blur-3xl',
          subtle
            ? 'bg-[radial-gradient(circle,rgb(27_63_208/0.10),transparent_62%)] dark:bg-[radial-gradient(circle,rgb(47_91_255/0.12),transparent_62%)]'
            : 'bg-[radial-gradient(circle,rgb(27_63_208/0.16),transparent_62%)] dark:bg-[radial-gradient(circle,rgb(47_91_255/0.20),transparent_62%)]',
        )}
      />
      <div
        className={cn(
          'absolute -right-[14%] top-[34%] size-[52vmax] rounded-full blur-3xl',
          subtle
            ? 'bg-[radial-gradient(circle,rgb(124_196_255/0.12),transparent_62%)] dark:bg-[radial-gradient(circle,rgb(76_141_255/0.10),transparent_62%)]'
            : 'bg-[radial-gradient(circle,rgb(124_196_255/0.20),transparent_62%)] dark:bg-[radial-gradient(circle,rgb(76_141_255/0.16),transparent_62%)]',
        )}
      />
      <div
        className={cn(
          'absolute bottom-[-18%] left-[28%] size-[48vmax] rounded-full blur-3xl',
          subtle
            ? 'bg-[radial-gradient(circle,rgb(99_102_241/0.08),transparent_62%)] dark:bg-[radial-gradient(circle,rgb(99_102_241/0.10),transparent_62%)]'
            : 'bg-[radial-gradient(circle,rgb(99_102_241/0.14),transparent_62%)] dark:bg-[radial-gradient(circle,rgb(99_102_241/0.16),transparent_62%)]',
        )}
      />
    </div>
  )
}
