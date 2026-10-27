import type { SearchPropertiesFilters } from '../types/public-property'

export const publicPropertyQueryKeys = {
  all: ['marketplace', 'properties'] as const,
  featured: () => [...publicPropertyQueryKeys.all, 'featured'] as const,
  mini: () => [...publicPropertyQueryKeys.all, 'mini'] as const,
  search: (filters: SearchPropertiesFilters) =>
    [...publicPropertyQueryKeys.all, 'search', filters] as const,
}
