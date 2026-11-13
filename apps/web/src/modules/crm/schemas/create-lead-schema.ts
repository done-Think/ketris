import { LEAD_SOURCES } from '@shared/config/lead-sources'
import { z } from 'zod'

import { CRM_LIMITS } from '@server/crm/constants/validation'
import type { SchemaMessageTranslator } from '@shared/types'
import { createPropertySelectionSchema } from './property-schema'

export function createLeadSchema(
  t: SchemaMessageTranslator<
    | 'budgetRequired'
    | 'budgetInvalid'
    | 'emailInvalid'
    | 'interestRequired'
    | 'nameRequired'
    | 'phoneInvalid'
    | 'sourceRequired'
    | 'textTooLong'
  >,
) {
  return z.object({
    name: z.string().trim().min(2, t('nameRequired')).max(CRM_LIMITS.name, t('textTooLong')),
    phone: z.string().trim().min(14, t('phoneInvalid')).max(CRM_LIMITS.phone, t('textTooLong')),
    email: z
      .string()
      .trim()
      .max(CRM_LIMITS.email, t('emailInvalid'))
      .refine((value) => !value || z.string().email().safeParse(value).success, t('emailInvalid')),
    property: createPropertySelectionSchema(() => t('interestRequired')),
    budget: z
      .number()
      .min(0.01, t('budgetRequired'))
      .max(CRM_LIMITS.proposedValue, t('budgetInvalid'))
      .refine(
        (value) => Math.abs(value * 100 - Math.round(value * 100)) < 0.0001,
        t('budgetInvalid'),
      ),
    source: z.enum(LEAD_SOURCES, { message: t('sourceRequired') }),
    notes: z.string().trim().max(CRM_LIMITS.notes, t('textTooLong')),
  })
}

export const createLeadDefaultValues = {
  name: '',
  phone: '',
  email: '',
  property: null,
  budget: 0,
  source: 'MARKETPLACE',
  notes: '',
} satisfies z.infer<ReturnType<typeof createLeadSchema>>
