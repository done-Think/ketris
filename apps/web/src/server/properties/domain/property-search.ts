import type { PropertyType } from '../types/property'

const typeTerms: Record<PropertyType, string[]> = {
  APARTMENT: ['apartamento', 'apartment'],
  HOUSE: ['casa', 'house'],
  STUDIO: ['studio', 'estudio'],
  PENTHOUSE: ['cobertura', 'penthouse', 'ático'],
  COMMERCIAL: ['comercial', 'commercial'],
  LOFT: ['loft'],
  OTHER: ['outro', 'other', 'otro'],
}

export function matchingPropertyTypes(search: string): PropertyType[] {
  const normalized = search.toLocaleLowerCase()
  return (Object.keys(typeTerms) as PropertyType[]).filter((type) =>
    typeTerms[type].some((term) => term.includes(normalized)),
  )
}
