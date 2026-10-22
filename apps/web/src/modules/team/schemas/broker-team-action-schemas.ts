import { z } from 'zod'

import type { SchemaMessageTranslator } from '@shared/types'

export function createBrokerGoalSchema(t: SchemaMessageTranslator) {
  return z.object({
    monthlyGoal: z.coerce.number().int().min(1, t('goalError')).max(10000, t('goalError')),
  })
}

export function createBrokerInviteSchema(t: SchemaMessageTranslator) {
  return z.object({
    name: z.string().trim().min(1, t('inviteNameError')),
    email: z.string().trim().email(t('inviteEmailError')),
    password: z
      .string()
      .min(8, t('invitePasswordError'))
      .regex(/[A-Z]/, t('invitePasswordError'))
      .regex(/[a-z]/, t('invitePasswordError'))
      .regex(/\d/, t('invitePasswordError'))
      .regex(/[^A-Za-z0-9]/, t('invitePasswordError')),
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
