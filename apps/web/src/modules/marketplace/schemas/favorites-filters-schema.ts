import { z } from 'zod'

import { favoritesPurposeFilters } from '../config/favorites'
import { searchSortOptions } from '../config/search-results-filters'

export const favoritesFiltersSchema = z.object({
  purpose: z.enum(favoritesPurposeFilters).catch('all'),
  sort: z.enum(searchSortOptions).catch('relevancia'),
})
