import type { Prisma } from '@prisma/client'
import type { crmPropertyInclude } from '../infrastructure/crm-property.mapper'
export type CrmPropertyRow = Prisma.ImovelGetPayload<{ include: typeof crmPropertyInclude }>
