import type { UseFormHandleSubmit } from 'react-hook-form'
import type { AgendaEventFormValues } from './agenda-event'

export type AgendaSchedule = Pick<
  AgendaEventFormValues,
  'scheduledDate' | 'scheduledTime' | 'durationMinutes'
>

export interface AgendaScheduleConfirmationOptions {
  open: boolean
  handleSubmit: UseFormHandleSubmit<AgendaEventFormValues>
  onSubmit: (values: AgendaEventFormValues) => unknown | Promise<unknown>
  unchangedSchedule?: AgendaSchedule
}

export interface AgendaScheduleConfirmationDialogProps {
  open: boolean
  isPending: boolean
  onBack: () => void
  onConfirm: () => void
}
