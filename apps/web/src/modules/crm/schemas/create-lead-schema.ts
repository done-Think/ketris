import { LEAD_SOURCES } from '@shared/config/lead-sources'
import { z } from 'zod'

import { CRM_LIMITS } from '@server/crm/constants/validation'
import type { SchemaMessageTranslator } from '@shared/types'
import { createPropertySelectionSchema } from './property-schema'

export function createLeadSchema(
  t: SchemaMessageTranslator<
    | 'budgetRequired'
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
      .string()
      .trim()
      .min(2, t('budgetRequired'))
      .max(CRM_LIMITS.shortText, t('textTooLong')),
    source: z.enum(LEAD_SOURCES, { message: t('sourceRequired') }),
    notes: z.string().trim().max(CRM_LIMITS.notes, t('textTooLong')),
  })
}

export const createLeadDefaultValues = {
  name: '',
  phone: '',
  email: '',
  property: null,
  budget: '',
  source: 'MARKETPLACE',
  notes: '',
} satisfies z.infer<ReturnType<typeof createLeadSchema>>
