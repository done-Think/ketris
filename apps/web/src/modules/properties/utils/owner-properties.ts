import type { OwnerProperty, OwnerPropertyFilters } from '../types/owner-property'

function normalizeFilterValue(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim()
}

export function filterOwnerProperties(
  properties: OwnerProperty[],
  filters: OwnerPropertyFilters,
): OwnerProperty[] {
  const normalizedQuery = normalizeFilterValue(filters.searchQuery)

  return properties.filter((property) => {
    const matchesSearch =
      normalizedQuery.length === 0 ||
      [property.title, property.address, property.code].some((value) =>
        normalizeFilterValue(value).includes(normalizedQuery),
      )
    const matchesStatus =
      filters.status === 'all' ||
      (filters.status === 'without-proposals'
        ? property.proposals === 0
        : property.status === filters.status)
    const matchesPurpose = filters.purpose === 'all' || property.purpose === filters.purpose

    return matchesSearch && matchesStatus && matchesPurpose
  })
}
