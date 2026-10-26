import { z } from 'zod'

import type { SchemaMessageTranslator } from '@shared/types'

import { isMaintenanceCategory } from '../utils/maintenance-category'

export function createMaintenanceTicketSchema(t: SchemaMessageTranslator) {
  return z.object({
    contractId: z.string().min(1, t('contractRequired')),
    propertyId: z.string().min(1, t('propertyRequired')),
    category: z.string().refine(isMaintenanceCategory, t('categoryRequired')),
    priority: z.enum(['normal', 'high', 'urgent'], { message: t('priorityRequired') }),
    title: z.string().trim().min(1, t('titleRequired')),
    description: z.string().trim().min(1, t('descriptionRequired')),
  })
}

export function createMaintenanceScheduleSchema(t: SchemaMessageTranslator) {
  return z.object({
    scheduledDate: z
      .string()
      .min(1, t('required'))
      .refine((value) => {
        const date = new Date(`${value}T12:00:00Z`)
        return (
          /^\d{4}-\d{2}-\d{2}$/.test(value) &&
          !Number.isNaN(date.getTime()) &&
          date.toISOString().slice(0, 10) === value
        )
      }, t('invalid')),
    scheduledHour: z
      .string()
      .min(1, t('required'))
      .regex(/^([01]\d|2[0-3])$/, t('invalid')),
    scheduledMinute: z
      .string()
      .min(1, t('required'))
      .regex(/^[0-5]\d$/, t('invalid')),
  })
}
