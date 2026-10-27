import type { SchemaMessageTranslator } from '@shared/types'
import { z } from 'zod'

export function createMaintenanceLinksSchema(t: SchemaMessageTranslator) {
  return z
    .object({
      contractId: z.string().min(1, t('required')),
      ownerId: z.string(),
      partyId: z.string(),
      renterId: z.string(),
    })
    .superRefine((values, context) => {
      if (values.partyId && !values.renterId)
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['renterId'],
          message: t('required'),
        })
      if (!values.ownerId && !(values.partyId && values.renterId))
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['ownerId'],
          message: t('linkRequired'),
        })
    })
}
