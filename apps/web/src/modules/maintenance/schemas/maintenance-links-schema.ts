import { z } from 'zod'

import type { SchemaMessageTranslator } from '@shared/types'

export function createMaintenanceLinksSchema(t: SchemaMessageTranslator) {
  return z
    .object({
      contractId: z.string().min(1, t('contractRequired')),
      ownerId: z.string(),
      partyId: z.string(),
      renterId: z.string(),
    })
    .refine((values) => !values.partyId || values.renterId, {
      path: ['renterId'],
      message: t('renterRequired'),
    })
    .refine((values) => values.ownerId || values.partyId, {
      path: ['ownerId'],
      message: t('nothingToLink'),
    })
}
