import { z } from 'zod'

import { normalizeMaintenanceCategory } from '@shared/lib/utils/maintenance-categories'

export const maintenanceDraftSchema = z.object({
  contractId: z.string(),
  category: z.string().transform((value) => normalizeMaintenanceCategory(value) ?? ''),
  priority: z.enum(['normal', 'high', 'urgent']),
  title: z.string(),
  description: z.string(),
})
