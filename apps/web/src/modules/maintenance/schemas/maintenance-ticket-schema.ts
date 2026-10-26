import { z } from 'zod'

import { maintenanceCategories } from '@shared/lib/utils/maintenance-categories'

import type { SchemaMessageTranslator } from '@shared/types'

export function createMaintenanceTicketSchema(t: SchemaMessageTranslator) {
  return z.object({
    contractId: z.string().min(1, t('contractRequired')),
    category: z.enum(maintenanceCategories, { message: t('categoryRequired') }),
    priority: z.enum(['normal', 'high', 'urgent'], { message: t('priorityRequired') }),
    title: z.string().trim().min(1, t('titleRequired')).max(200, t('titleTooLong')),
    description: z
      .string()
      .trim()
      .min(1, t('descriptionRequired'))
      .max(10000, t('descriptionTooLong')),
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
