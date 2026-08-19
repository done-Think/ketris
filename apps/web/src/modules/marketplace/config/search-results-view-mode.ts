import type { ViewMode } from '../types/search'

export const searchResultsViewModeCookieKey = 'ketris_marketplace_search_results_view_mode'

export const isSearchResultsViewMode = (value: string | null | undefined): value is ViewMode =>
  value === 'grid' || value === 'list'
