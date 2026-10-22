import { Compass, Home } from 'lucide-react'
import { ButtonLink } from '@/components/ui/Button'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export default function NotFoundPage({ title = 'Page not found', message = 'The page you’re looking for has moved or doesn’t exist.' }: { title?: string; message?: string }) {
  useDocumentTitle(title)
  return (
    <section className="container-page grid min-h-[60vh] place-items-center py-20 text-center">
      <div>
        <p className="num font-display text-[120px] font-extrabold leading-none tracking-tighter text-surface-3">404</p>
        <h1 className="-mt-4 font-display text-3xl font-bold text-fg">{title}</h1>
        <p className="mx-auto mt-2 max-w-md text-muted">{message}</p>
        <div className="mt-8 flex justify-center gap-3">
          <ButtonLink to="/" variant="outline" leftIcon={<Home className="size-4" />}>Home</ButtonLink>
          <ButtonLink to="/explore" leftIcon={<Compass className="size-4" />}>Explore apps</ButtonLink>
        </div>
      </div>
    </section>
  )
}
