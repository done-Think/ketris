import { z } from 'zod'

export const editDemoTenantSchema = z.object({
  name: z.string().trim().min(1, 'nameRequired'),
  plan: z.enum(['starter', 'pro', 'enterprise']),
  status: z.enum(['active', 'trial', 'suspended']),
})

export type EditDemoTenantValues = z.infer<typeof editDemoTenantSchema>
