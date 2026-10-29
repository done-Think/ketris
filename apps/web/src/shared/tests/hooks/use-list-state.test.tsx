import { act, renderHook } from '@testing-library/react'
import { expect, it } from 'vitest'

import { useListState } from '../../hooks/use-list-state'

it('altera um filtro por vez ou vários de uma vez sem perder os demais', () => {
  const { result } = renderHook(() => useListState({ q: '', page: 3, status: 'all' }))

  act(() => result.current.setFilter('q', 'casa'))
  expect(result.current.filters).toEqual({ q: 'casa', page: 3, status: 'all' })

  act(() => result.current.updateFilters({ status: 'open', page: 1 }))
  expect(result.current.filters).toEqual({ q: 'casa', page: 1, status: 'open' })
})

it('mantém as funções estáveis entre renderizações', () => {
  const { result, rerender } = renderHook(() => useListState({ page: 1 }))
  const { setFilter, updateFilters } = result.current

  rerender()

  expect(result.current.setFilter).toBe(setFilter)
  expect(result.current.updateFilters).toBe(updateFilters)
})
