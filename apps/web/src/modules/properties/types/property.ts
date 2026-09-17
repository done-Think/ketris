import type { z } from 'zod'

import type {
  propertyAddressSchema,
  propertyMediaSchema,
  propertySchema,
  propertyStatusEnum,
  propertyValuesSchema,
} from '../schemas/property-schema'

export type PropertyFormValues = z.infer<typeof propertySchema>
export type PropertyAddress = z.infer<typeof propertyAddressSchema>
export type PropertyMedia = z.infer<typeof propertyMediaSchema>
export type PropertyStatus = z.infer<typeof propertyStatusEnum>
export type PropertyValues = z.infer<typeof propertyValuesSchema>

export interface Property extends PropertyFormValues {
  id: string
  tenantId: string
  status: PropertyStatus
  address: string | PropertyAddress
  values?: PropertyValues
  media: PropertyMedia[]
  features: string[]
  responsibleUserId?: string
  createdAt: string
  updatedAt: string
}
