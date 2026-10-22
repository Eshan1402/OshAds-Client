import { useState } from 'react'
import { useToast } from '@/context/ToastContext'
import { campaignsService } from '@/services/campaignsService'
import { queryClient } from '@/services/queryClient'
import type { Campaign, CampaignStatus } from '@/types'

/** Shared campaign mutations with optimistic toasts + cache invalidation. */
export function useCampaignActions() {
  const toast = useToast()
  const [busy, setBusy] = useState<string | null>(null)

  const setStatus = async (c: Campaign, status: CampaignStatus, verb: string) => {
    setBusy(c.id)
    try {
      await campaignsService.setStatus(c.id, status)
      queryClient.invalidate('campaigns')
      queryClient.invalidate('analytics')
      toast({
        tone: 'success',
        title: `Campaign ${verb}`,
        description: c.name,
        action: status === 'archived' ? { label: 'Undo', onClick: () => setStatus({ ...c, status }, c.status, 'restored') } : undefined,
      })
    } catch (e) {
      toast({ tone: 'error', title: `Couldn’t update campaign`, description: (e as Error).message })
    } finally {
      setBusy(null)
    }
  }

  return {
    busy,
    pause: (c: Campaign) => setStatus(c, 'paused', 'paused'),
    resume: (c: Campaign) => setStatus(c, 'active', 'resumed'),
    archive: (c: Campaign) => setStatus(c, 'archived', 'archived'),
  }
}
