import { ThemeProvider } from '@mui/material'
import { act, render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { theme } from '@shared/theme/theme'

import { PlatformTenantsPage } from '../../components/PlatformTenantsPage'
import { platformTenants } from '../../data/platform-tenants-fixtures'

function renderPage() {
  return render(
    <ThemeProvider theme={theme}>
      <PlatformTenantsPage />
    </ThemeProvider>,
  )
}

describe('PlatformTenantsPage', () => {
  it('has exactly 45 deterministic fixtures with the reference plan totals', () => {
    expect(platformTenants).toHaveLength(45)
    expect(new Set(platformTenants.map((tenant) => tenant.id)).size).toBe(45)
    expect(platformTenants.filter((tenant) => tenant.plan === 'starter')).toHaveLength(18)
    expect(platformTenants.filter((tenant) => tenant.plan === 'pro')).toHaveLength(20)
    expect(platformTenants.filter((tenant) => tenant.plan === 'enterprise')).toHaveLength(7)
    expect(platformTenants.map((tenant) => tenant.mrr)).toEqual(
      expect.arrayContaining([2450, 1250, 490, 4900, 1840, 4200]),
    )
    expect(platformTenants.every((tenant) => typeof tenant.mrr === 'number')).toBe(true)
    expect(platformTenants.slice(0, 6).map((tenant) => tenant.id)).toEqual([
      'silva',
      'nexo',
      'vanguard',
      'apex',
      'orion',
      'prime',
    ])
  })
  it('renders the tenant management header, metrics and first fixture page', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'Tenants' })).toBeVisible()
    expect(screen.getAllByText('45')[0]).toBeVisible()
    expect(screen.getByText(/R\$\s*2\.450/)).toBeVisible()
    expect(screen.getByText('Silva & Corretores Associados')).toBeVisible()
    expect(screen.getByText('Consultoria Apex Imóveis')).toBeVisible()
    expect(screen.queryByText('Parque Residencial Ltda')).not.toBeInTheDocument()
    expect(screen.getByText('Mostrando 1–6 de 45 tenants')).toBeVisible()
  })

  it('keeps the New Tenant control visual only', async () => {
    const user = userEvent.setup()
    renderPage()

    const newTenant = screen.getByRole('button', { name: 'Novo Tenant' })
    expect(newTenant).not.toHaveAttribute('href')
    await user.click(newTenant)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('filters tenants by search and plan', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('Buscar tenant'), 'Vanguard')
    expect(screen.getByText('Vanguard Empreendimentos')).toBeVisible()
    expect(screen.queryByText('Nexo Imóveis Corporativos')).not.toBeInTheDocument()

    await user.clear(screen.getByLabelText('Buscar tenant'))
    await user.click(screen.getByLabelText('Filtrar por plano'))
    await user.click(screen.getByRole('option', { name: 'Enterprise' }))

    expect(screen.getByText('Silva & Corretores Associados')).toBeVisible()
    expect(screen.getByText('Vanguard Empreendimentos')).toBeVisible()
    expect(screen.queryByText('Nexo Imóveis Corporativos')).not.toBeInTheDocument()
  })

  it('combines status filters with search and plan', async () => {
    const user = userEvent.setup()
    renderPage()

    expect(screen.getByLabelText('Filtrar por status')).toHaveTextContent('Status: Todos')
    expect(screen.queryByText('Aliança Imobiliária Ltda')).not.toBeInTheDocument()

    await user.click(screen.getByLabelText('Filtrar por status'))
    await user.click(screen.getByRole('option', { name: 'Trial' }))
    expect(screen.getByText('Aliança Imobiliária Ltda')).toBeVisible()
    expect(screen.getByText('Parque Residencial Ltda')).toBeVisible()
    expect(screen.queryByText('Silva & Corretores Associados')).not.toBeInTheDocument()

    await user.click(screen.getByLabelText('Filtrar por status'))
    await user.click(screen.getByRole('option', { name: 'Suspenso' }))
    expect(screen.getByText('Lumen Real Estate')).toBeVisible()
    expect(screen.queryByText('Aliança Imobiliária Ltda')).not.toBeInTheDocument()

    await user.click(screen.getByLabelText('Filtrar por status'))
    await user.click(screen.getByRole('option', { name: 'Todos' }))
    expect(screen.getByText('Silva & Corretores Associados')).toBeVisible()

    await user.click(screen.getByLabelText('Filtrar por status'))
    await user.click(screen.getByRole('option', { name: 'Trial' }))
    await user.click(screen.getByLabelText('Filtrar por plano'))
    await user.click(screen.getByRole('option', { name: 'Starter' }))
    expect(screen.getByText('Aliança Imobiliária Ltda')).toBeVisible()
    expect(screen.getByText('Parque Residencial Ltda')).toBeVisible()

    await user.type(screen.getByLabelText('Buscar tenant'), 'inexistente')
    expect(screen.getByText('Nenhum tenant encontrado.')).toBeVisible()
    expect(screen.getByText('Mostrando 0–0 de 0 tenants')).toBeVisible()
  })

  it('paginates all 45 fixtures, visits pages two and three, and returns', async () => {
    const user = userEvent.setup()
    renderPage()

    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Próxima página' }))
    expect(screen.getByText('Aliança Imobiliária Ltda')).toBeVisible()
    expect(screen.getByText('Mostrando 7–12 de 45 tenants')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Próxima página' }))
    expect(screen.getByText('Lumen Real Estate')).toBeVisible()
    expect(screen.getByText('Mostrando 13–18 de 45 tenants')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Página anterior' }))
    expect(screen.getByText('Mostrando 7–12 de 45 tenants')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Página anterior' }))
    expect(screen.getByText('Mostrando 1–6 de 45 tenants')).toBeVisible()
  })

  it('sorts the complete result before pagination and resets the page', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('button', { name: 'Próxima página' }))
    await user.click(screen.getByRole('columnheader', { name: /^Nome/ }))
    expect(screen.getByText('Mostrando 1–6 de 45 tenants')).toBeVisible()
    const rows = within(screen.getByRole('grid')).getAllByRole('row')
    expect(rows[1]).toHaveTextContent('Aliança Imobiliária Ltda')
    expect(rows[2]).toHaveTextContent('Atlas Negócios')
    expect(rows).toHaveLength(7)
  })

  it('combines Pro, active status and Nexo with an accurate total', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByLabelText('Filtrar por plano'))
    await user.click(screen.getByRole('option', { name: 'Pro' }))
    await user.click(screen.getByLabelText('Filtrar por status'))
    await user.click(screen.getByRole('option', { name: 'Ativos' }))
    await user.type(screen.getByLabelText('Buscar tenant'), 'Nexo')
    expect(screen.getByText('Nexo Imóveis Corporativos')).toBeVisible()
    expect(screen.getByText('Mostrando 1–1 de 1 tenants')).toBeVisible()
  })

  it('edits demo data locally and preserves fixtures', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('button', { name: 'Editar Silva & Corretores Associados' }))
    const dialog = within(screen.getByRole('dialog'))
    await user.clear(dialog.getByLabelText('Nome'))
    await user.click(dialog.getByRole('button', { name: 'Salvar' }))
    expect(await dialog.findByText('Informe o nome.')).toBeVisible()
    await user.type(dialog.getByLabelText('Nome'), 'Silva Editado')
    await user.click(dialog.getByRole('button', { name: 'Salvar' }))
    expect(await screen.findByText('Silva Editado')).toBeVisible()
    expect(platformTenants[0].name).toBe('Silva & Corretores Associados')
  })

  it('opens the action menu by keyboard, restores focus, and reuses Edit', async () => {
    const user = userEvent.setup()
    renderPage()
    const trigger = screen.getByRole('button', {
      name: 'Mais ações para Silva & Corretores Associados',
    })
    act(() => trigger.focus())
    await user.keyboard('{Enter}')
    expect(screen.getByRole('menuitem', { name: 'Editar' })).toHaveFocus()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
    expect(trigger).toHaveFocus()
    await user.click(trigger)
    const backdrop = document.querySelector('.MuiBackdrop-root')
    expect(backdrop).not.toBeNull()
    if (backdrop) await user.click(backdrop)
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
    expect(trigger).toHaveFocus()
    await user.click(trigger)
    await user.click(screen.getByRole('menuitem', { name: 'Editar' }))
    expect(await screen.findByRole('dialog', { name: 'Editar tenant demonstrativo' })).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
