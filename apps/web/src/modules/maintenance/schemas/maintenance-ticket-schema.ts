import { z } from 'zod'

export type SchemaMessageTranslator = (key: string) => string

export function createMaintenanceTicketSchema(t: SchemaMessageTranslator) {
  return z.object({
    propertyId: z.string().min(1, t('propertyRequired')),
    category: z.string().min(1, t('categoryRequired')),
    priority: z.enum(['normal', 'high', 'urgent'], { message: t('priorityRequired') }),
    title: z.string().trim().min(1, t('titleRequired')),
    description: z.string().trim().min(1, t('descriptionRequired')),
  })
}
