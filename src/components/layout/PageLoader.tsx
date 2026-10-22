import { LogoMark } from '@/components/ui/Logo'

export function PageLoader() {
  return (
    <div className="grid min-h-[60vh] place-items-center" role="status" aria-label="Loading">
      <div className="relative">
        <span className="absolute inset-0 -m-2 animate-ping rounded-2xl bg-accent/20" aria-hidden />
        <LogoMark className="relative size-10" />
      </div>
    </div>
  )
}
