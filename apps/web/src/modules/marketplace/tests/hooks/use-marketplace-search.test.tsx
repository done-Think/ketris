import { act, renderHook } from '@testing-library/react'
import { expect, it } from 'vitest'

import { useMarketplaceSearch } from '../../hooks/use-marketplace-search'

it('começa sem nenhum filtro pré-selecionado', () => {
  const { result } = renderHook(() => useMarketplaceSearch())

  expect(result.current.selectedSearch).toEqual({ location: '', propertyType: '' })
  expect(result.current.priceRange).toEqual([null, null])
  expect(result.current.searchHref).toEqual({ pathname: '/properties', query: { purpose: 'rent' } })
})

it('seleciona valores, fecha o menu e monta o link da busca com o código do tipo', () => {
  const { result } = renderHook(() => useMarketplaceSearch())

  act(() => result.current.openSearchMenu('propertyType'))
  expect(result.current.activeSearchMenu).toBe('propertyType')
  act(() => result.current.selectSearchValue('propertyType', 'HOUSE'))
  act(() => result.current.selectSearchValue('location', 'Moema, São Paulo'))

  expect(result.current.activeSearchMenu).toBeNull()
  expect(result.current.searchHref.query).toEqual({
    purpose: 'rent',
    location: 'Moema, São Paulo',
    propertyType: 'HOUSE',
  })
})

it('reabrir o mesmo menu o fecha', () => {
  const { result } = renderHook(() => useMarketplaceSearch())

  act(() => result.current.openSearchMenu('location'))
  act(() => result.current.openSearchMenu('location'))

  expect(result.current.activeSearchMenu).toBeNull()
})

it('accepts free price limits, supports open ranges and rejects invalid ranges', () => {
  const { result } = renderHook(() => useMarketplaceSearch())
  expect(result.current.priceRangeLabel).toBe('Qualquer preço')
  act(() => result.current.updatePriceRange([500000, 2000000]))
  expect(result.current.priceRange).toEqual([500000, 2000000])
  expect(result.current.searchHref.query.priceRange).toBe('500000-2000000')
  act(() => result.current.updatePriceRange([null, 750000]))
  expect(result.current.priceRangeLabel).toContain('750.000')
  expect(result.current.searchHref.query.priceRange).toBe('-750000')
  act(() => result.current.updatePriceRange([8000, 2000]))
  act(() => result.current.updatePriceRange([-1, null]))
  expect(result.current.priceRange).toEqual([null, 750000])
  act(() => result.current.updatePriceRange([5000, null]))
  expect(result.current.searchHref.query.priceRange).toBe('5000-')
  act(() => result.current.updatePriceRange([null, null]))
  expect(result.current.searchHref.query).not.toHaveProperty('priceRange')
})

it('filtra as opções pelo rótulo traduzido, ignorando acentos', () => {
  const { result } = renderHook(() =>
    useMarketplaceSearch(['Moema, São Paulo', 'Savassi, Belo Horizonte']),
  )

  act(() => result.current.setSearchDraft({ location: 'sao paulo', propertyType: 'apart' }))

  expect(result.current.filterSearchOptions('location')).toContain('Moema, São Paulo')
  expect(result.current.filterSearchOptions('location')).not.toContain('Savassi, Belo Horizonte')
  expect(result.current.filterSearchOptions('propertyType')).toEqual(['APARTMENT'])
  expect(result.current.getSearchOptionLabel('propertyType', '')).toBe('Todos os tipos')
})

it('uses the current published location catalog and keeps free-text searches available', () => {
  const { result, rerender } = renderHook(({ locations }) => useMarketplaceSearch(locations), {
    initialProps: { locations: [] as string[] },
  })
  expect(result.current.filterSearchOptions('location')).toEqual([])
  rerender({ locations: ['Anhumas, Itajubá', 'Centro, Itajubá'] })
  act(() => result.current.setSearchDraft({ location: 'anhumas', propertyType: '' }))
  expect(result.current.filterSearchOptions('location')).toEqual(['Anhumas, Itajubá'])
  act(() =>
    result.current.setSearchDraft({ location: 'Local ainda sem sugestão', propertyType: '' }),
  )
  expect(result.current.filterSearchOptions('location')).toEqual([])
  expect(result.current.searchHref.query).toMatchObject({ location: 'Local ainda sem sugestão' })
})

it('inclui a finalidade escolhida no link da busca', () => {
  const { result } = renderHook(() => useMarketplaceSearch())

  act(() => result.current.setPurpose('buy'))

  expect(result.current.purpose).toBe('buy')
  expect(result.current.searchHref.query).toEqual({ purpose: 'buy' })
})
