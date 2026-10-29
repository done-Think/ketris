'use client'

import { useCallback, useSyncExternalStore } from 'react'

import {
  defaultSearchResultsViewMode,
  getSearchResultsViewModeCookie,
  getSearchResultsViewModeCookieKey,
  isSearchResultsViewMode,
} from '../config/search-results-view-mode'
import type { SearchResultsViewModeScope, ViewMode } from '../types/search'

const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function readViewMode(scope: SearchResultsViewModeScope): ViewMode {
  const cookieKey = getSearchResultsViewModeCookieKey(scope)
  const cookieValue = document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith(`${cookieKey}=`))
    ?.slice(cookieKey.length + 1)

  return isSearchResultsViewMode(cookieValue) ? cookieValue : defaultSearchResultsViewMode
}

export function useViewModePreference(scope: SearchResultsViewModeScope) {
  const viewMode = useSyncExternalStore(
    subscribe,
    () => readViewMode(scope),
    () => defaultSearchResultsViewMode,
  )

  const setViewMode = useCallback(
    (mode: ViewMode) => {
      document.cookie = getSearchResultsViewModeCookie(mode, scope)
      listeners.forEach((listener) => listener())
    },
    [scope],
  )

  return { setViewMode, viewMode }
}
