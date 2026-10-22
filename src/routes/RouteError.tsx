import { RefreshCw } from 'lucide-react'
import { isRouteErrorResponse, useRouteError } from 'react-router-dom'
import { Button, ButtonLink } from '@/components/ui/Button'
import { LogoMark } from '@/components/ui/Logo'

/** Last-resort boundary for render errors and failed lazy chunk loads (e.g. after a deploy). */
export function RouteError() {
  const error = useRouteError()
  const chunk = error instanceof Error && /dynamically imported module|Loading chunk/i.test(error.message)
  const message = isRouteErrorResponse(error) ? `${error.status} ${error.statusText}` : chunk ? 'A newer version of OshAds is available.' : 'An unexpected error occurred while showing this page.'
  return (
    <div className="grid min-h-dvh place-items-center bg-bg px-6 text-center">
      <div>
        <LogoMark className="mx-auto size-12" />
        <h1 className="mt-6 font-display text-2xl font-bold text-fg">{chunk ? 'Update available' : 'Something went wrong'}</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">{message}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Button onClick={() => location.reload()} leftIcon={<RefreshCw className="size-4" />}>Reload</Button>
          <ButtonLink to="/" variant="outline">Go home</ButtonLink>
        </div>
      </div>
    </div>
  )
}
