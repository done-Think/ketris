import type {
  PropertyAddress,
  PropertyFormValues,
  PropertyMedia,
  PropertyStatus,
  PropertyValues,
} from '../schemas/property-schema'

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
