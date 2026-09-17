import { ThemeProvider } from '@mui/material'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { theme } from '@shared/theme/theme'

import { PlatformTenantsPage } from '../../components/PlatformTenantsPage'

function renderPage() {
  return render(
    <ThemeProvider theme={theme}>
      <PlatformTenantsPage />
    </ThemeProvider>,
  )
}

describe('PlatformTenantsPage', () => {
  it('renders the tenant management header, metrics and first fixture page', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'Tenants' })).toBeVisible()
    expect(screen.getAllByText('45')[0]).toBeVisible()
    expect(screen.getByText('Silva & Corretores Associados')).toBeVisible()
    expect(screen.getByText('Consultoria Apex Imóveis')).toBeVisible()
    expect(screen.queryByText('Parque Residencial Ltda')).not.toBeInTheDocument()
    expect(screen.getByText('Mostrando 1–6 de 45 tenants')).toBeVisible()
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

  it('starts with active tenants and combines status filters with search and plan', async () => {
    const user = userEvent.setup()
    renderPage()

    expect(screen.getByLabelText('Filtrar por status')).toHaveTextContent('Status: Ativos')
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
    expect(screen.getByText('Aliança Imobiliária Ltda')).toBeVisible()
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

  it('paginates fixture data after selecting all statuses', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByLabelText('Filtrar por status'))
    await user.click(screen.getByRole('option', { name: 'Todos' }))
    await user.click(screen.getByRole('button', { name: 'Próximo' }))
    expect(screen.getByText('Orion Gestão Imobiliária')).toBeVisible()
    expect(screen.getByText('Mostrando 7–12 de 18 tenants')).toBeVisible()
  })
})
