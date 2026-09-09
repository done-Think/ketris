import { ThemeProvider } from '@mui/material'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'

import { OwnerBottomNavigation } from '../../components/OwnerBottomNavigation'

vi.mock('next/navigation', () => ({ usePathname: () => '/dashboard/imoveis' }))
vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: { user: { name: 'Carlos Oliveira', email: 'carlos@example.com' } } }),
}))

describe('OwnerBottomNavigation', () => {
  it('links to existing owner routes and opens the current user profile', async () => {
    render(
      <ThemeProvider theme={theme}>
        <OwnerBottomNavigation />
      </ThemeProvider>,
    )
    const user = userEvent.setup()
    const navigation = within(
      screen.getByRole('navigation', { name: 'Navegação inferior do proprietário' }),
    )
    for (const [name, href] of [
      ['Painel', '/dashboard'],
      ['Imóveis', '/dashboard/imoveis'],
      ['Propostas', '/dashboard/propostas'],
      ['Visitas', '/dashboard/agenda'],
    ]) {
      expect(navigation.getByRole('link', { name })).toHaveAttribute('href', href)
    }
    expect(navigation.getByRole('link', { name: 'Imóveis' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await user.click(navigation.getByRole('button', { name: 'Perfil' }))
    const dialog = within(screen.getByRole('dialog', { name: 'Perfil' }))
    expect(dialog.getByText('Carlos Oliveira')).toBeVisible()
    expect(dialog.getByText('carlos@example.com')).toBeVisible()
    await user.click(dialog.getByRole('button', { name: 'Fechar' }))
    expect(await navigation.findByRole('link', { name: 'Imóveis' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })
})
