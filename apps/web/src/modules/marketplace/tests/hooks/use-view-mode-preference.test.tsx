import { act, renderHook } from '@testing-library/react'
import { beforeEach, expect, it } from 'vitest'

import { getSearchResultsViewModeCookieKey } from '../../config/search-results-view-mode'
import { useViewModePreference } from '../../hooks/use-view-mode-preference'

function clearCookie(scope: 'rent' | 'buy') {
  document.cookie = `${getSearchResultsViewModeCookieKey(scope)}=; path=/; max-age=0`
}

beforeEach(() => {
  clearCookie('rent')
  clearCookie('buy')
})

it('começa em grade e lê a preferência salva no cookie do escopo', () => {
  document.cookie = `${getSearchResultsViewModeCookieKey('buy')}=list; path=/`

  expect(renderHook(() => useViewModePreference('rent')).result.current.viewMode).toBe('grid')
  expect(renderHook(() => useViewModePreference('buy')).result.current.viewMode).toBe('list')
})

it('salva a escolha e atualiza todos os consumidores do mesmo escopo', () => {
  const first = renderHook(() => useViewModePreference('rent'))
  const second = renderHook(() => useViewModePreference('rent'))
  const other = renderHook(() => useViewModePreference('buy'))

  act(() => first.result.current.setViewMode('list'))

  expect(document.cookie).toContain(`${getSearchResultsViewModeCookieKey('rent')}=list`)
  expect(second.result.current.viewMode).toBe('list')
  expect(other.result.current.viewMode).toBe('grid')
})

it('ignora valores inválidos no cookie', () => {
  document.cookie = `${getSearchResultsViewModeCookieKey('rent')}=mosaic; path=/`

  expect(renderHook(() => useViewModePreference('rent')).result.current.viewMode).toBe('grid')
})
