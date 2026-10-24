import type { PropertyType } from '../types/property'

const typeTerms: Record<PropertyType, string[]> = {
  APARTAMENTO: ['apartamento', 'apartment'],
  CASA: ['casa', 'house'],
  STUDIO: ['studio', 'estudio'],
  COBERTURA: ['cobertura', 'penthouse', 'ático'],
  COMERCIAL: ['comercial', 'commercial'],
  LOFT: ['loft'],
  OUTRO: ['outro', 'other', 'otro'],
}

export function matchingPropertyTypes(search: string): PropertyType[] {
  const normalized = search.toLocaleLowerCase()
  return (Object.keys(typeTerms) as PropertyType[]).filter((type) =>
    typeTerms[type].some((term) => term.includes(normalized)),
  )
}
