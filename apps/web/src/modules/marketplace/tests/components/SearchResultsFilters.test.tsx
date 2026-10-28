import { ThemeProvider } from '@mui/material'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'

import { SearchResultsFilterButton } from '../../components/search-results/SearchResultsFilters'
import { emptySearchResultsFilters } from '../../hooks/use-search-results'
import type { SearchResultsFilterButtonProps } from '../../types/search'

function renderSearchResultsFilterButton(overrides: Partial<SearchResultsFilterButtonProps> = {}) {
  const props: SearchResultsFilterButtonProps = {
    filters: emptySearchResultsFilters,
    activeFiltersCount: 0,
    onApply: vi.fn(),
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
  it('mounts the form only when the dialog opens', () => {
    renderSearchResultsFilterButton()

    expect(screen.queryByLabelText('Preço máximo')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Filtros' }))
    expect(screen.getByLabelText('Preço máximo')).toBeInTheDocument()
  })

  it('applies the draft filters in a single submit', async () => {
    const props = renderSearchResultsFilterButton()

    fireEvent.click(screen.getByRole('button', { name: 'Filtros' }))
    fireEvent.change(screen.getByLabelText('Preço máximo'), { target: { value: '8500' } })
    fireEvent.change(screen.getByLabelText('Área mínima'), { target: { value: '95' } })
    fireEvent.click(screen.getByRole('checkbox', { name: 'Somente imóveis com vaga' }))
    fireEvent.click(screen.getByRole('button', { name: 'Concluir' }))

    await waitFor(() => expect(props.onApply).toHaveBeenCalledTimes(1))
    expect(props.onApply).toHaveBeenCalledWith(
      expect.objectContaining({
        customMaxPrice: '8500',
        customMinArea: '95',
        onlyWithParking: true,
        propertyType: null,
      }),
    )
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('selects a property type by its enum code', async () => {
    const props = renderSearchResultsFilterButton()

    fireEvent.click(screen.getByRole('button', { name: 'Filtros' }))
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Tipo' }))
    fireEvent.click(within(screen.getByRole('listbox')).getByRole('option', { name: 'Casa' }))
    fireEvent.click(screen.getByRole('button', { name: 'Concluir' }))

    await waitFor(() =>
      expect(props.onApply).toHaveBeenCalledWith(
        expect.objectContaining({ propertyType: 'HOUSE' }),
      ),
    )
  })

  it('clears the draft back to the empty filters without applying', () => {
    const props = renderSearchResultsFilterButton({
      filters: { ...emptySearchResultsFilters, customMaxPrice: '5000', onlyWithParking: true },
      activeFiltersCount: 2,
    })

    fireEvent.click(screen.getByRole('button', { name: 'Filtros (2)' }))
    fireEvent.click(screen.getByRole('button', { name: 'Limpar' }))

    expect(screen.getByLabelText('Preço máximo')).toHaveValue('')
    expect(screen.getByRole('checkbox', { name: 'Somente imóveis com vaga' })).not.toBeChecked()
    expect(props.onApply).not.toHaveBeenCalled()
  })

  it('shows the active filters count on the trigger', () => {
    renderSearchResultsFilterButton({ activeFiltersCount: 3 })

    expect(screen.getByRole('button', { name: 'Filtros (3)' })).toBeVisible()
  })
})
