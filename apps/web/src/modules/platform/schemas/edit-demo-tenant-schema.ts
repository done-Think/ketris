import { z } from 'zod'

export type SchemaMessageTranslator = (key: string) => string

export function createEditDemoTenantSchema(t: SchemaMessageTranslator) {
  return z.object({
    name: z.string().trim().min(1, t('nameRequired')),
    plan: z.enum(['starter', 'pro', 'enterprise']),
    status: z.enum(['active', 'trial', 'suspended']),
  })
}

export type EditDemoTenantValues = z.infer<ReturnType<typeof createEditDemoTenantSchema>>
