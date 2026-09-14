import { ThemeProvider } from '@mui/material'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { theme } from '@shared/theme/theme'

import { MarketplaceHeader } from '../../components/MarketplaceHeader'

function renderMarketplaceHeader() {
  render(
    <ThemeProvider theme={theme}>
      <MarketplaceHeader activeItemId="brokers" />
    </ThemeProvider>,
  )
}

describe('MarketplaceHeader', () => {
  it('renders the shared profile avatar action on marketplace pages', () => {
    renderMarketplaceHeader()

    expect(screen.getByRole('button', { name: 'Abrir perfil' })).toBeVisible()
    expect(screen.getByRole('img', { name: 'Rafael Martins' })).toBeVisible()
  })
})
