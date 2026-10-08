import dayjs from 'dayjs'
import { z } from 'zod'

import { isWithinBusinessHours, meetsMinimumAdvanceNotice } from '../utils/scheduling-window'

export type SchemaMessageTranslator = (key: string) => string

export const agendaOtherPropertyValue = 'other'

export const agendaEventKindOptions = [
  'VISIT',
  'FOLLOW_UP',
  'MEETING',
  'INSPECTION',
  'SIGNATURE',
  'OTHER',
] as const

export interface BuildAgendaEventFormSchemaOptions {
  unchangedScheduleDate?: string
  unchangedScheduleTime?: string
}

export function buildAgendaEventFormSchema(
  t: SchemaMessageTranslator,
  options: BuildAgendaEventFormSchemaOptions = {},
) {
  const agendaEventFormShape = {
    customProperty: z.string(),
    durationMinutes: z.coerce.number().min(15, t('durationTooShort')),
    kind: z.enum(agendaEventKindOptions).optional().or(z.literal('')),
    notes: z.string(),
    participant: z.string().min(2, t('participantRequired')),
    phone: z.string().min(14, t('phoneInvalid')),
    propertyId: z.string().min(1, t('propertyRequired')),
    scheduledDate: z.string().min(1, t('dateRequired')),
    scheduledTime: z.string().min(1, t('timeRequired')),
    title: z.string().min(3, t('titleRequired')),
  }

  return z.object(agendaEventFormShape).superRefine((values, context) => {
    if (values.propertyId === agendaOtherPropertyValue && values.customProperty.trim().length < 3) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: t('customPropertyRequired'),
        path: ['customProperty'],
      })
    }

    if (values.kind === 'VISIT' && values.durationMinutes < 60) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: t('visitMinimumDuration'),
        path: ['durationMinutes'],
      })
    }

    const isUnchangedSchedule =
      values.scheduledDate === options.unchangedScheduleDate &&
      values.scheduledTime === options.unchangedScheduleTime

    if (isUnchangedSchedule || !values.scheduledDate || !values.scheduledTime) return

    const start = dayjs(`${values.scheduledDate}T${values.scheduledTime}`)
    if (!start.isValid()) return

    if (!meetsMinimumAdvanceNotice(start)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: t('minimumAdvanceNotice'),
        path: ['scheduledTime'],
      })
      return
    }

    if (!isWithinBusinessHours(start)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: t('outsideBusinessHours'),
        path: ['scheduledTime'],
      })
    }
  })
}
