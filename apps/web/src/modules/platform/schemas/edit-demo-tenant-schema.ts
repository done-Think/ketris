import { z } from 'zod'

import type { SchemaMessageTranslator } from '@shared/types'

export function createEditDemoTenantSchema(t: SchemaMessageTranslator) {
  return z.object({
    name: z.string().trim().min(1, t('nameRequired')),
    plan: z.enum(['starter', 'pro', 'enterprise']),
    status: z.enum(['active', 'trial', 'suspended']),
  })
}

export type EditDemoTenantValues = z.infer<ReturnType<typeof createEditDemoTenantSchema>>
