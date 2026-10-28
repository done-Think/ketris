import { ThemeProvider } from '@mui/material'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'

import { MobileSearchBox } from '../../components/MobileSearchBox'
import type { MobileSearchBoxProps } from '../../types/search'

function renderMobileSearchBox(overrides: Partial<MobileSearchBoxProps> = {}) {
  const props: MobileSearchBoxProps = {
    selectedSearch: {
      location: 'Jardins, São Paulo',
      propertyType: 'APARTMENT',
    },
    priceRange: [0, 10000],
    priceRangeLabel: 'R$ 0 - R$ 10.000',
    activeSearchMenu: null,
    searchDraft: { location: '', propertyType: '' },
    searchHref: '/properties',
    purpose: 'rent',
    setPurpose: vi.fn(),
    mobileSearchRef: { current: null },
    openSearchMenu: vi.fn(),
    closeSearchMenu: vi.fn(),
    selectSearchValue: vi.fn(),
    updatePriceRange: vi.fn(),
    filterSearchOptions: () => [],
    getSearchOptionLabel: (_key, value) => (value === 'APARTMENT' ? 'Apartamento' : value),
    setSearchDraft: vi.fn(),
    ...overrides,
  }

  render(
    <ThemeProvider theme={theme}>
      <MobileSearchBox {...props} />
    </ThemeProvider>,
  )

  return props
}

describe('MobileSearchBox', () => {
  it('opens a full-screen dialog with the same filters as the desktop search', async () => {
    const user = userEvent.setup()
    renderMobileSearchBox()

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Buscar por bairro, cidade...' }))

    const dialog = screen.getByRole('dialog', { name: 'Buscar imóveis' })
    expect(within(dialog).getByText('Jardins, São Paulo')).toBeInTheDocument()
    expect(within(dialog).getByText('Apartamento')).toBeInTheDocument()
    expect(within(dialog).getByText('R$ 0 - R$ 10.000')).toBeInTheDocument()
    expect(within(dialog).getByRole('link', { name: 'Buscar' })).toHaveAttribute('href')
  })

  it('opens the selected filter menu and closes everything on dismiss', async () => {
    const user = userEvent.setup()
    const props = renderMobileSearchBox()

    await user.click(screen.getByRole('button', { name: 'Buscar por bairro, cidade...' }))
    const dialog = screen.getByRole('dialog', { name: 'Buscar imóveis' })

    await user.click(within(dialog).getByRole('button', { name: /Faixa de preço/ }))
    expect(props.openSearchMenu).toHaveBeenCalledWith('priceRange')

    await user.click(within(dialog).getByRole('button', { name: 'Fechar busca' }))
    expect(props.closeSearchMenu).toHaveBeenCalled()
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })
})
