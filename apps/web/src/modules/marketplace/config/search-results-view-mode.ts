import type { ViewMode } from '../types/search'

export const defaultSearchResultsViewMode: ViewMode = 'grid'
export const searchResultsViewModes = ['grid', 'list'] as const satisfies readonly ViewMode[]
export const searchResultsViewModeCookieKey = 'ketris_marketplace_search_results_view_mode'
export const searchResultsViewModeCookieMaxAge = 60 * 60 * 24 * 365
export const searchResultsViewModeCookiePath = '/'
export const searchResultsViewModeCookieSameSite = 'lax'

export const isSearchResultsViewMode = (value: string | null | undefined): value is ViewMode =>
  searchResultsViewModes.includes(value as ViewMode)

export const getSearchResultsViewModeCookie = (mode: ViewMode) =>
  [
    `${searchResultsViewModeCookieKey}=${encodeURIComponent(mode)}`,
    `path=${searchResultsViewModeCookiePath}`,
    `max-age=${searchResultsViewModeCookieMaxAge}`,
    `samesite=${searchResultsViewModeCookieSameSite}`,
  ].join('; ')
