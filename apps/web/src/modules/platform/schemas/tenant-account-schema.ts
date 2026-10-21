import { z } from 'zod'

import { TENANT_ACCOUNT_TYPES, TENANT_STATUSES } from '../types/tenant'

export function createTenantAccountSchema() {
  return z.object({
    accountType: z.enum(TENANT_ACCOUNT_TYPES),
    status: z.enum(TENANT_STATUSES),
  })
}
