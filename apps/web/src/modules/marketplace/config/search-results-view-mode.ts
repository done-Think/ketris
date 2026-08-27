import type { ViewMode } from '../types/search'

export type SearchResultsViewModeScope = 'alugar' | 'comprar' | 'corretores' | 'imobiliarias'

export const defaultSearchResultsViewMode: ViewMode = 'grid'
export const searchResultsViewModes = ['grid', 'list'] as const satisfies readonly ViewMode[]
export const searchResultsViewModeCookieKey = 'ketris_marketplace_view_mode'
export const searchResultsViewModeCookieMaxAge = 60 * 60 * 24 * 365
export const searchResultsViewModeCookiePath = '/'
export const searchResultsViewModeCookieSameSite = 'lax'

export const isSearchResultsViewMode = (value: string | null | undefined): value is ViewMode =>
  searchResultsViewModes.includes(value as ViewMode)

export const getSearchResultsViewModeCookieKey = (scope: SearchResultsViewModeScope) =>
  `${searchResultsViewModeCookieKey}_${scope}`

export const getSearchResultsViewModeCookie = (mode: ViewMode, scope: SearchResultsViewModeScope) =>
  [
    `${getSearchResultsViewModeCookieKey(scope)}=${encodeURIComponent(mode)}`,
    `path=${searchResultsViewModeCookiePath}`,
    `max-age=${searchResultsViewModeCookieMaxAge}`,
    `samesite=${searchResultsViewModeCookieSameSite}`,
  ].join('; ')
