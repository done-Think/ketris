import type { z } from 'zod'
import type { createMaintenanceLinksSchema } from '../schemas/maintenance-links-schema'

export type MaintenanceLinksFormValues = z.infer<ReturnType<typeof createMaintenanceLinksSchema>>
