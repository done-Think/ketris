'use client'

import { Alert, Button, Stack } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useRef, useState } from 'react'
import { useStartInteraction } from '../../hooks/use-interactions'
import type {
  InteractionChannel,
  StartInteractionPayload,
  TrackedLeadContactDialogProps,
} from '../../types/interaction'
import { LeadContactDialog } from '../LeadContactDialog'
import { InteractionHistory } from './InteractionHistory'

export function TrackedLeadContactDialog(props: TrackedLeadContactDialogProps) {
  const t = useTranslations('crm.interactions')
  const leadId = props.lead?.id ?? null
  const start = useStartInteraction(leadId)
  const busy = useRef(false)
  const [failedAttempt, setFailedAttempt] = useState<StartInteractionPayload | null>(null)
  async function saveAttempt(payload: StartInteractionPayload) {
    busy.current = true
    setFailedAttempt(null)
    try {
      await start.mutateAsync(payload)
    } catch {
      setFailedAttempt(payload)
    } finally {
      busy.current = false
    }
  }
  function contactAction(channel: InteractionChannel) {
    if (busy.current || !leadId) return false
    void saveAttempt({ channel, requestId: crypto.randomUUID() })
    return true
  }
  return (
    <LeadContactDialog
      {...props}
      onContactAction={contactAction}
      contactActionPending={start.isPending}
      interactionPanel={
        props.lead && (
          <Stack spacing={2}>
            {start.isPending && <Alert severity="info">{t('recording')}</Alert>}
            {start.isSuccess && <Alert severity="info">{t('attemptRecorded')}</Alert>}
            {failedAttempt && (
              <Alert
                severity="warning"
                action={
                  <Button
                    onClick={() => void saveAttempt(failedAttempt)}
                    disabled={start.isPending}
                  >
                    {t('retryRecord')}
                  </Button>
                }
              >
                {t('startError')}
              </Alert>
            )}
            <InteractionHistory key={leadId} target={{ kind: 'lead', id: props.lead.id }} />
          </Stack>
        )
      }
    />
  )
}
