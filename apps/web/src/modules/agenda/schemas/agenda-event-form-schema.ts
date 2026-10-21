import dayjs from 'dayjs'
import { z } from 'zod'

import { meetsMinimumAdvanceNotice } from '../utils/scheduling-window'
import { AGENDA_MINIMUM_VISIT_MINUTES } from '@shared/lib/utils/agenda-scheduling'
import type { BuildAgendaEventFormSchemaOptions } from '../types/agenda-event'
import type { SchemaMessageTranslator } from '@shared/types'

export const agendaOtherPropertyValue = 'other'

export const agendaEventKindOptions = [
  'VISIT',
  'FOLLOW_UP',
  'MEETING',
  'INSPECTION',
  'SIGNATURE',
  'OTHER',
] as const

export function buildAgendaEventFormSchema(
  t: SchemaMessageTranslator,
  options: BuildAgendaEventFormSchemaOptions = {},
) {
  const agendaEventFormShape = {
    outsideBusinessHoursConfirmed: z.boolean().default(false),
    internal: z.boolean().default(false),
    audience: z.enum(['LEGACY_TEAM', 'ALL_AGENTS', 'ASSIGNED_AGENT']).default('LEGACY_TEAM'),
    responsibleId: z.string().default(''),
    customProperty: z.string(),
    durationMinutes: z.coerce.number().min(15, t('durationTooShort')),
    kind: z.enum(agendaEventKindOptions).optional().or(z.literal('')),
    notes: z.string(),
    participant: z.string(),
    phone: z.string(),
    propertyId: z.string(),
    scheduledDate: z.string().min(1, t('dateRequired')),
    scheduledTime: z.string().min(1, t('timeRequired')),
    title: z.string().min(3, t('titleRequired')),
  }

  return z.object(agendaEventFormShape).superRefine((values, context) => {
    if (!values.internal) {
      for (const [path, invalid, key] of [
        ['participant', values.participant.trim().length < 2, 'participantRequired'],
        ['phone', values.phone.length < 14, 'phoneInvalid'],
        ['propertyId', !values.propertyId, 'propertyRequired'],
      ] as const) {
        if (invalid)
          context.addIssue({ code: z.ZodIssueCode.custom, message: t(key), path: [path] })
      }
    }
    if (values.audience === 'ASSIGNED_AGENT' && !values.responsibleId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: t('agentRequired'),
        path: ['responsibleId'],
      })
    }
    if (values.internal && values.audience === 'LEGACY_TEAM') {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: t('audienceRequired'),
        path: ['audience'],
      })
    }
    if (values.propertyId === agendaOtherPropertyValue && values.customProperty.trim().length < 3) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: t('customPropertyRequired'),
        path: ['customProperty'],
      })
    }

    if (values.kind === 'VISIT' && values.durationMinutes < AGENDA_MINIMUM_VISIT_MINUTES) {
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
  })
}
