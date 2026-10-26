import { normalizeMaintenanceCategory } from '@server/maintenance/constants/maintenance-categories'
import { z } from 'zod'

export const maintenanceDraftSchema = z.object({
  contractId: z.string(),
  category: z.string().transform(normalizeMaintenanceCategory),
  priority: z.enum(['normal', 'high', 'urgent']),
  title: z.string(),
  description: z.string(),
})
