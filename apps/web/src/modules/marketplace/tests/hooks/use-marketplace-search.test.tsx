import { act, renderHook } from '@testing-library/react'
import { expect, it } from 'vitest'

import { priceLimit } from '../../config/search-filters'
import { useMarketplaceSearch } from '../../hooks/use-marketplace-search'

it('começa sem nenhum filtro pré-selecionado', () => {
  const { result } = renderHook(() => useMarketplaceSearch())

  expect(result.current.selectedSearch).toEqual({ location: '', propertyType: '' })
  expect(result.current.priceRange).toEqual([priceLimit.min, priceLimit.max])
  expect(result.current.searchHref).toEqual({ pathname: '/properties', query: {} })
})

it('seleciona valores, fecha o menu e monta o link da busca com o código do tipo', () => {
  const { result } = renderHook(() => useMarketplaceSearch())

  act(() => result.current.openSearchMenu('propertyType'))
  expect(result.current.activeSearchMenu).toBe('propertyType')
  act(() => result.current.selectSearchValue('propertyType', 'CASA'))
  act(() => result.current.selectSearchValue('location', 'Moema, São Paulo'))

  expect(result.current.activeSearchMenu).toBeNull()
  expect(result.current.searchHref.query).toEqual({
    location: 'Moema, São Paulo',
    propertyType: 'CASA',
  })
})

it('reabrir o mesmo menu o fecha', () => {
  const { result } = renderHook(() => useMarketplaceSearch())

  act(() => result.current.openSearchMenu('location'))
  act(() => result.current.openSearchMenu('location'))

  expect(result.current.activeSearchMenu).toBeNull()
})

it('limita e ordena a faixa de preço', () => {
  const { result } = renderHook(() => useMarketplaceSearch())

  act(() => result.current.updatePriceRange([8000, -50]))
  expect(result.current.priceRange).toEqual([priceLimit.min, 8000])

  act(() => result.current.updatePriceRange([2000, priceLimit.max * 3]))
  expect(result.current.priceRange).toEqual([2000, priceLimit.max])
  expect(result.current.searchHref.query).toEqual({ priceRange: `2000-${priceLimit.max}` })
})

it('filtra as opções pelo rótulo traduzido, ignorando acentos', () => {
  const { result } = renderHook(() => useMarketplaceSearch())

  act(() => result.current.setSearchDraft({ location: 'sao paulo', propertyType: 'apart' }))

  expect(result.current.filterSearchOptions('location')).toContain('Moema, São Paulo')
  expect(result.current.filterSearchOptions('location')).not.toContain('Savassi, Belo Horizonte')
  expect(result.current.filterSearchOptions('propertyType')).toEqual(['APARTAMENTO'])
  expect(result.current.getSearchOptionLabel('propertyType', '')).toBe('Todos os tipos')
})
