'use client'

import { useEffect, useState } from 'react'

import {
  defaultSearchResultsViewMode,
  getSearchResultsViewModeCookie,
  getSearchResultsViewModeCookieKey,
  isSearchResultsViewMode,
  type SearchResultsViewModeScope,
} from '../config/search-results-view-mode'
import type { ViewMode } from '../types/search'

function getStoredViewMode(scope: SearchResultsViewModeScope) {
  const cookieKey = getSearchResultsViewModeCookieKey(scope)
  const cookieValue = document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith(`${cookieKey}=`))
    ?.slice(cookieKey.length + 1)

  return isSearchResultsViewMode(cookieValue) ? cookieValue : undefined
}

export function useViewModePreference(scope: SearchResultsViewModeScope) {
  const [viewMode, setViewModeState] = useState<ViewMode>(defaultSearchResultsViewMode)

  useEffect(() => {
    const storedViewMode = getStoredViewMode(scope)

    if (storedViewMode) setViewModeState(storedViewMode)
  }, [scope])

  const setViewMode = (mode: ViewMode) => {
    document.cookie = getSearchResultsViewModeCookie(mode, scope)
    setViewModeState(mode)
  }

  return { setViewMode, viewMode }
}
