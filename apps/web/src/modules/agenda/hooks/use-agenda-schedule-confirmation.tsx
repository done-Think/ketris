'use client'

import { Button, Stack } from '@mui/material'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useSnackbar, type SnackbarKey } from 'notistack'
import type { UseFormHandleSubmit } from 'react-hook-form'
import dayjs from 'dayjs'
import type { AgendaEventFormValues } from '../types/agenda-event'
import { isWithinBusinessHours } from '../utils/scheduling-window'

type Schedule = Pick<AgendaEventFormValues, 'scheduledDate' | 'scheduledTime' | 'durationMinutes'>
function samePeriod(first: Schedule, second?: Schedule) {
  return (
    first.scheduledDate === second?.scheduledDate &&
    first.scheduledTime === second.scheduledTime &&
    first.durationMinutes === second.durationMinutes
  )
}

export function useAgendaScheduleConfirmation({
  open,
  scopeKey,
  handleSubmit,
  onSubmit,
  unchangedSchedule,
}: {
  open: boolean
  scopeKey?: string
  handleSubmit: UseFormHandleSubmit<AgendaEventFormValues>
  onSubmit: (values: AgendaEventFormValues) => unknown | Promise<unknown>
  unchangedSchedule?: Schedule
}) {
  const t = useTranslations('agenda.eventForm.outsideHoursWarning')
  const { enqueueSnackbar, closeSnackbar } = useSnackbar()
  const pending = useRef<{ key: SnackbarKey; resolve: (value: boolean) => void } | null>(null)
  const [waiting, setWaiting] = useState(false)
  const closeRef = useRef(closeSnackbar)
  closeRef.current = closeSnackbar

  const finish = useCallback((accepted: boolean, key?: SnackbarKey) => {
    const current = pending.current
    if (!current || (key !== undefined && current.key !== key)) return
    pending.current = null
    setWaiting(false)
    closeRef.current(current.key)
    current.resolve(accepted)
  }, [])

  useEffect(() => {
    if (!open) finish(false)
    return () => finish(false)
  }, [open, scopeKey, finish])

  async function submit(values: AgendaEventFormValues): Promise<void> {
    if (!open || pending.current) return
    const outside = !isWithinBusinessHours(
      dayjs(`${values.scheduledDate}T${values.scheduledTime}`),
      values.durationMinutes,
    )
    if (outside && !samePeriod(values, unchangedSchedule)) {
      const accepted = await new Promise<boolean>((resolve) => {
        const key = enqueueSnackbar(t('message'), {
          variant: 'warning',
          persist: true,
          action: (key) => (
            <Stack direction="row" spacing={1}>
              <Button color="inherit" autoFocus onClick={() => finish(false, key)}>
                {t('back')}
              </Button>
              <Button color="inherit" onClick={() => finish(true, key)}>
                {t('continue')}
              </Button>
            </Stack>
          ),
          onClose: (_event, _reason, key) => finish(false, key),
        })
        pending.current = { key, resolve }
        setWaiting(true)
      })
      if (!accepted) return
    }
    // Validate again so changes made while the toast was open cannot save stale data.
    await handleSubmit(async (current) => {
      if (!samePeriod(current, values)) return submit(current)
      await onSubmit({ ...current, outsideBusinessHoursConfirmed: outside })
    })()
  }

  return { submit, waiting, cancel: () => finish(false) }
}
