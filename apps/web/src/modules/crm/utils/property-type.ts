import { crmPropertyTypes } from '../config/property-types'
import type { CrmPropertyType } from '../types/property'

export function toCrmPropertyType(value: string | null | undefined): CrmPropertyType {
  return crmPropertyTypes.find((propertyType) => propertyType === value) ?? 'OTHER'
}
