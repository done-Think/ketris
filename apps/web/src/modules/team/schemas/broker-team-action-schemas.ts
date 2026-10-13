import { z } from 'zod'

import type { SchemaMessageTranslator } from '@shared/types'

export function createBrokerGoalSchema(t: SchemaMessageTranslator) {
  return z.object({
    monthlyGoal: z.coerce.number().int().min(1, t('goalError')).max(10000, t('goalError')),
  })
}

export function createBrokerTransferSchema(t: SchemaMessageTranslator) {
  return z
    .object({
      destinationId: z.string().min(1, t('destinationError')),
      leads: z.boolean(),
      properties: z.boolean(),
    })
    .refine((values) => values.leads || values.properties, {
      path: ['leads'],
      message: t('itemsError'),
    })
}
