import { ThemeProvider } from '@mui/material'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'

import { SearchResultsFilterButton } from '../../components/search-results/SearchResultsFilters'
import type { SearchResultsFilterButtonProps } from '../../types/search'

function renderSearchResultsFilterButton(overrides: Partial<SearchResultsFilterButtonProps> = {}) {
  const props: SearchResultsFilterButtonProps = {
    areaFilterIndex: 0,
    bedroomFilterIndex: 0,
    customMaxPrice: '',
    customMinArea: '',
    maxPrice: null,
    minArea: null,
    onlyWithParking: false,
    priceFilterIndex: 0,
    propertyTypeFilter: '',
    setAreaFilterIndex: vi.fn(),
    setBedroomFilterIndex: vi.fn(),
    setCustomMaxPrice: vi.fn(),
    setCustomMinArea: vi.fn(),
    setOnlyWithParking: vi.fn(),
    setPriceFilterIndex: vi.fn(),
    setPropertyTypeFilter: vi.fn(),
    ...overrides,
  }

  render(
    <ThemeProvider theme={theme}>
      <SearchResultsFilterButton {...props} />
    </ThemeProvider>,
  )

  return props
}

describe('SearchResultsFilterButton', () => {
  it('applies draft filters through the dialog form', async () => {
    const props = renderSearchResultsFilterButton()

    fireEvent.click(screen.getByRole('button', { name: 'Filtros' }))
    fireEvent.change(screen.getByLabelText('Preço máximo'), { target: { value: '8500' } })
    fireEvent.change(screen.getByLabelText('Área mínima'), { target: { value: '95' } })
    fireEvent.click(screen.getByRole('checkbox', { name: 'Somente imóveis com vaga' }))
    fireEvent.click(screen.getByRole('button', { name: 'Concluir' }))

    await waitFor(() => {
      expect(props.setCustomMaxPrice).toHaveBeenCalledWith('8500')
      expect(props.setCustomMinArea).toHaveBeenCalledWith('95')
      expect(props.setOnlyWithParking).toHaveBeenCalledWith(true)
    })
    expect(props.setPriceFilterIndex).toHaveBeenCalledWith(0)
    expect(props.setAreaFilterIndex).toHaveBeenCalledWith(0)
  })

  it('keeps the active filters count on the trigger', () => {
    renderSearchResultsFilterButton({
      maxPrice: 8500,
      onlyWithParking: true,
      propertyTypeFilter: 'Apartamento',
    })

    expect(screen.getByRole('button', { name: 'Filtros (3)' })).toBeVisible()
  })
})
