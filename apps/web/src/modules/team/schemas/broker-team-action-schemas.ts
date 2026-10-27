import { z } from 'zod'

import { createNewPasswordSchema } from '@shared/schemas/new-password-schema'
import type { SchemaMessageTranslator } from '@shared/types'

export function createBrokerGoalSchema(t: SchemaMessageTranslator) {
  return z.object({
    monthlySales: z.coerce
      .number()
      .int(t('goalError'))
      .min(1, t('goalError'))
      .max(10000, t('goalError')),
  })
}

export function createBrokerInviteSchema(t: SchemaMessageTranslator) {
  return z.object({
    name: z.string().trim().min(1, t('inviteNameError')).max(120, t('inviteNameError')),
    email: z.string().trim().max(254, t('inviteEmailError')).email(t('inviteEmailError')),
  })
}

export function createBrokerTransferSchema(t: SchemaMessageTranslator) {
  return z
    .object({
      destinationId: z.string().min(1, t('destinationError')),
      properties: z.boolean(),
      leads: z.boolean(),
      futureEvents: z.boolean(),
    })
    .refine((values) => values.properties || values.leads || values.futureEvents, {
      path: ['properties'],
      message: t('itemsError'),
    })
}

export function createBrokerDeactivateSchema(t: SchemaMessageTranslator) {
  return z.object({ destinationId: z.string().min(1, t('destinationError')) })
}

export function createAcceptInvitationSchema(t: SchemaMessageTranslator) {
  return z
    .object({
      password: createNewPasswordSchema(t),
      passwordConfirmation: z.string().min(1, t('passwordConfirmationRequired')),
    })
    .refine((values) => values.password === values.passwordConfirmation, {
      path: ['passwordConfirmation'],
      message: t('passwordMismatch'),
    })
}
