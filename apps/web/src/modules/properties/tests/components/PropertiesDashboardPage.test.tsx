import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '@mui/material/styles'
import { SnackbarProvider } from 'notistack'
import { describe, expect, it } from 'vitest'

import { theme } from '@shared/theme/theme'

import { PropertiesDashboardPage } from '../../components/PropertiesDashboardPage'
import { getDashboardPropertyById } from '../../data/dashboard-properties'
import { ownerProperties } from '../../fixtures/owner-properties'

function renderPage() {
  return render(
    <ThemeProvider theme={theme}>
      <SnackbarProvider>
        <PropertiesDashboardPage />
      </SnackbarProvider>
    </ThemeProvider>,
  )
}

describe('PropertiesDashboardPage', () => {
  it('filters through the mobile pills and shows publication age', async () => {
    renderPage()
    const user = userEvent.setup()
    const filters = within(screen.getByRole('group', { name: 'Filtrar imóveis' }))
    expect(screen.getByRole('link', { name: '+ Novo' })).toHaveAttribute(
      'href',
      '/dashboard/imoveis/novo',
    )
    await user.click(filters.getByRole('button', { name: 'Ativos' }))
    expect(screen.getAllByRole('article')).toHaveLength(3)
    await user.click(filters.getByRole('button', { name: 'Pausados' }))
    expect(screen.getAllByRole('article')).toHaveLength(1)
    expect(screen.getByText('Há 12 dias')).toBeInTheDocument()
    await user.click(filters.getByRole('button', { name: 'Sem Proposta' }))
    expect(filters.getByRole('button', { name: 'Sem Proposta' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getAllByRole('article')).toHaveLength(1)
    await user.click(filters.getByRole('button', { name: 'Todos' }))
    expect(screen.getAllByRole('article')).toHaveLength(4)
  })

  it('renders the four reference cards with metrics and compatible detail links', () => {
    renderPage()
    expect(screen.getAllByRole('article')).toHaveLength(4)
    expect(screen.getByText(/4 IMÓVEIS · 3 ATIVOS · 1 PAUSADO/)).toHaveTextContent(
      '342 VISUALIZAÇÕES TOTAIS · 7 PROPOSTAS ABERTAS',
    )
    for (const property of ownerProperties) {
      const card = within(screen.getByRole('article', { name: property.title }))
      expect(card.getByText(property.address)).toBeVisible()
      expect(card.getByText(property.price)).toBeVisible()
      expect(card.getByText(`${property.views}`)).toBeVisible()
      expect(card.getByRole('link', { name: 'Editar Anúncio' })).toHaveAttribute(
        'href',
        `/dashboard/imoveis/${property.id}`,
      )
      expect(getDashboardPropertyById(property.id)).toBeDefined()
      expect(card.getByRole('link', { name: 'Ver Propostas' })).toHaveAttribute(
        'href',
        '/dashboard/propostas',
      )
    }
    expect(screen.getByRole('link', { name: 'Novo Imóvel' })).toHaveAttribute(
      'href',
      '/dashboard/imoveis/novo',
    )
  })

  it('searches by address and code, and resets an empty result', async () => {
    renderPage()
    const user = userEvent.setup()
    const search = screen.getByRole('textbox', { name: 'Buscar por endereço ou código' })
    fireEvent.change(search, { target: { value: 'Cunha Gago' } })
    expect(screen.getAllByRole('article')).toHaveLength(1)
    expect(screen.getByRole('heading', { name: 'Studio Loft Pinheiros' })).toBeVisible()
    fireEvent.change(search, { target: { value: 'imv-004' } })
    expect(screen.getByRole('heading', { name: 'Apartamento Moderno Moema' })).toBeVisible()
    fireEvent.change(search, { target: { value: 'inexistente' } })
    expect(screen.queryAllByRole('article')).toHaveLength(0)
    expect(screen.getByRole('status')).toHaveTextContent('Nenhum imóvel encontrado.')
    await user.click(screen.getByRole('button', { name: 'Limpar filtros' }))
    expect(screen.getAllByRole('article')).toHaveLength(4)
  })

  it('combines status and purpose filters', async () => {
    renderPage()
    const user = userEvent.setup()
    await user.click(screen.getByRole('combobox', { name: 'Status' }))
    await user.click(screen.getByRole('option', { name: 'Ativo' }))
    expect(screen.getAllByRole('article')).toHaveLength(3)
    await user.click(screen.getByRole('combobox', { name: 'Status' }))
    await user.click(screen.getByRole('option', { name: 'Pausado' }))
    expect(screen.getAllByRole('article')).toHaveLength(1)
    expect(screen.getByRole('heading', { name: 'Apartamento Moderno Moema' })).toBeVisible()
    await user.click(screen.getByRole('combobox', { name: 'Tipo' }))
    await user.click(screen.getByRole('option', { name: 'Venda' }))
    expect(screen.queryAllByRole('article')).toHaveLength(0)
    await user.click(screen.getByRole('combobox', { name: 'Tipo' }))
    await user.click(screen.getByRole('option', { name: 'Todos' }))
    expect(screen.getAllByRole('article')).toHaveLength(1)
  })

  it('explains the unavailable pause action and opens the details menu', async () => {
    renderPage()
    const user = userEvent.setup()
    const card = within(screen.getByRole('article', { name: ownerProperties[0].title }))
    await user.click(card.getByRole('button', { name: 'Pausar' }))
    expect(screen.getByRole('alert')).toHaveTextContent(
      'A opção de pausar anúncios ainda não está disponível.',
    )
    expect(screen.getAllByRole('article')).toHaveLength(4)
    await user.click(card.getByRole('button', { name: /Mais ações/ }))
    expect(screen.getByRole('menuitem', { name: 'Ver detalhes' })).toHaveAttribute(
      'href',
      '/dashboard/imoveis/apt-jardins-3q',
    )
    await user.keyboard('{Escape}')
    expect(card.getByRole('button', { name: /Mais ações/ })).toHaveFocus()
  })
})
