'use client'

import { useState } from 'react'
import dayjs from 'dayjs'
import type { AgendaEventFormValues } from '../types/agenda-event'
import type { AgendaSchedule, AgendaScheduleConfirmationOptions } from '../types/agenda-schedule'
import { agendaPeriod, sameAgendaPeriod } from '../utils/agenda-schedule'
import { isWithinBusinessHours } from '../utils/scheduling-window'

export function useAgendaScheduleConfirmation({
  open,
  handleSubmit,
  onSubmit,
  unchangedSchedule,
}: AgendaScheduleConfirmationOptions) {
  const [pendingSchedule, setPendingSchedule] = useState<AgendaSchedule | null>(null)

  function outsideBusinessHours(values: AgendaSchedule) {
    return !isWithinBusinessHours(
      dayjs(`${values.scheduledDate}T${values.scheduledTime}`),
      values.durationMinutes,
    )
  }

  async function submit(values: AgendaEventFormValues) {
    if (!open) return
    const outside = outsideBusinessHours(values)
    if (outside && !sameAgendaPeriod(values, unchangedSchedule)) {
      setPendingSchedule(agendaPeriod(values))
      return
    }
    setPendingSchedule(null)
    await onSubmit({ ...values, outsideBusinessHoursConfirmed: outside })
  }

  const confirm = handleSubmit(async (values) => {
    if (!open || !pendingSchedule) return
    const outside = outsideBusinessHours(values)
    if (outside && !sameAgendaPeriod(values, pendingSchedule)) {
      setPendingSchedule(agendaPeriod(values))
      return
    }
    setPendingSchedule(null)
    await onSubmit({ ...values, outsideBusinessHoursConfirmed: outside })
  })

  return {
    submit,
    confirm,
    waiting: open && pendingSchedule !== null,
    cancel: () => setPendingSchedule(null),
  }
}
