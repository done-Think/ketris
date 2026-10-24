import pt from '@/i18n/messages/pt-BR/properties.json'
import en from '@/i18n/messages/en-US/properties.json'
import es from '@/i18n/messages/es-ES/properties.json'

import type { PropertyListFilters, PropertyStatus, PropertyType } from '../types/property'

const dictionaries = { 'pt-BR': pt, 'en-US': en, 'es-ES': es }
const typeKeys: Record<PropertyType, keyof typeof pt.dashboard.mapping.propertyTypes> = {
  APARTAMENTO: 'apartment',
  CASA: 'house',
  STUDIO: 'studio',
  COBERTURA: 'penthouse',
  COMERCIAL: 'commercial',
  LOFT: 'loft',
  OUTRO: 'other',
}
const statusKeys: Record<PropertyStatus, keyof typeof pt.dashboard.filters> = {
  DRAFT: 'inReview',
  PUBLISHED: 'available',
  RENTED: 'rented',
  SOLD: 'sold',
  INACTIVE: 'inactive',
}
export const propertyDatabaseStatus: Record<PropertyStatus, string> = {
  DRAFT: 'RASCUNHO',
  PUBLISHED: 'PUBLICADO',
  RENTED: 'ALUGADO',
  SOLD: 'VENDIDO',
  INACTIVE: 'INATIVO',
}

export function getPropertyLabelOrder(
  filters: Pick<PropertyListFilters, 'sortBy' | 'locale'>,
): string[] {
  const locale = filters.locale ?? 'pt-BR'
  const messages = dictionaries[locale]
  const entries =
    filters.sortBy === 'type'
      ? Object.entries(typeKeys).map(([value, key]) => ({
          value,
          label: messages.dashboard.mapping.propertyTypes[key],
        }))
      : Object.entries(statusKeys).map(([value, key]) => ({
          value: propertyDatabaseStatus[value as PropertyStatus],
          label: messages.dashboard.filters[key],
        }))
  const collator = new Intl.Collator(locale)
  return entries.sort((a, b) => collator.compare(a.label, b.label)).map(({ value }) => value)
}
