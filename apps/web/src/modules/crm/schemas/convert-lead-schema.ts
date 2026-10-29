import { z } from 'zod'

import { CRM_LIMITS } from '@server/crm/constants/validation'
import type { SchemaMessageTranslator } from '@shared/types'
import { createPropertySelectionSchema } from './property-schema'

export function createConvertLeadSchema(
  t: SchemaMessageTranslator<'emailInvalid' | 'propertyRequired' | 'proposedValueInvalid'>,
) {
  return z.object({
    property: createPropertySelectionSchema(t),
    email: z.string().trim().max(CRM_LIMITS.email).email(t('emailInvalid')),
    proposedValue: z
      .number()
      .min(0.01, t('proposedValueInvalid'))
      .max(CRM_LIMITS.proposedValue, t('proposedValueInvalid'))
      .refine(
        (value) => Math.abs(value * 100 - Math.round(value * 100)) < 0.0001,
        t('proposedValueInvalid'),
      ),
  })
}
