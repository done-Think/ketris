import type { CrmPropertyType } from '../types/property'

export const crmPropertyTypes = [
  'APARTMENT',
  'HOUSE',
  'STUDIO',
  'PENTHOUSE',
  'COMMERCIAL',
  'LOFT',
  'OTHER',
] as const satisfies readonly CrmPropertyType[]
