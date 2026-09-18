import { ThemeProvider } from '@mui/material'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'

import { LeadsDashboardPage } from '../../components/LeadsDashboardPage'
import { leadFixtures } from '../../fixtures/lead-fixtures'
import { useLeadsStore } from '../../stores/leads-store'

const mocks = vi.hoisted(() => ({
  enqueueSnackbar: vi.fn(),
  searchParams: new URLSearchParams(),
}))

vi.mock('notistack', () => ({
  useSnackbar: () => ({ enqueueSnackbar: mocks.enqueueSnackbar }),
}))

vi.mock('next/navigation', () => ({
  useSearchParams: () => mocks.searchParams,
}))

function renderPage() {
  return render(
    <ThemeProvider theme={theme}>
      <LeadsDashboardPage />
    </ThemeProvider>,
  )
}

describe('LeadsDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.searchParams = new URLSearchParams()
    useLeadsStore.setState({ leads: [...leadFixtures] })
  })

  it('opens the create lead dialog from the header button', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Novo Lead' }))

    expect(screen.getByRole('dialog', { name: /Registrar lead/ })).toBeVisible()
  })

  it('adds a lead created through the dialog to the visible list', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Novo Lead' }))
    await user.type(screen.getByLabelText('Nome'), 'Fernanda Alves')
    await user.type(screen.getByLabelText('Telefone'), '11977776666')
    await user.type(screen.getByLabelText(/E-mail/), 'fernanda@example.com')
    await user.click(screen.getByRole('button', { name: 'Próximo' }))
    await user.type(screen.getByLabelText('Imóvel ou interesse'), 'Casa Morumbi')
    await user.type(screen.getByLabelText('Orçamento'), 'R$ 1.2M')
    await user.type(screen.getByLabelText('Corretor responsável'), 'Ana Paula')
    await user.click(screen.getByRole('button', { name: 'Próximo' }))
    await user.click(screen.getByRole('button', { name: 'Criar lead' }))

    expect(await screen.findAllByText('Fernanda Alves')).not.toHaveLength(0)
  })

  it('opens the contact dialog with the selected lead when clicking Contato', async () => {
    const user = userEvent.setup()
    renderPage()

    const table = screen.getByRole('table', { name: 'Leads do CRM' })
    const row = within(table).getByText('João Silva').closest('tr')
    expect(row).not.toBeNull()

    await user.click(within(row as HTMLElement).getByRole('button', { name: 'Contato' }))

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('João Silva')).toBeVisible()
    expect(within(dialog).getByText('joao.silva@email.com')).toBeVisible()
  })

  it('filters the list by search term', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('Buscar leads'), 'Rafael')

    expect(screen.getAllByText('Rafael Lima').length).toBeGreaterThan(0)
    expect(screen.queryAllByText('João Silva')).toHaveLength(0)
  })

  it('filters the list by stage and shows per-filter counts', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('combobox', { name: 'Filtrar leads por status' }))
    await user.click(screen.getByRole('option', { name: /^Novo/ }))

    expect(screen.getAllByText('João Silva').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Guilherme Santos').length).toBeGreaterThan(0)
    expect(screen.queryAllByText('Maria Fernandes')).toHaveLength(0)
  })

  it('sorts leads through the table column headers', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Orçamento' }))

    const table = screen.getByRole('table', { name: 'Leads do CRM' })
    const rows = within(table).getAllByRole('row')

    expect(within(rows[1]).getByText('Maria Fernandes')).toBeVisible()
  })

  it('navigates between pages using the dashboard pagination', async () => {
    const user = userEvent.setup()
    renderPage()

    expect(screen.queryAllByText('Patrícia Lima')).toHaveLength(0)

    await user.click(screen.getByRole('button', { name: /next page/i }))

    expect(screen.getAllByText('Patrícia Lima').length).toBeGreaterThan(0)
    expect(screen.queryAllByText('João Silva')).toHaveLength(0)
  })

  it('opens the contact dialog for the lead referenced by the leadId query param', () => {
    mocks.searchParams = new URLSearchParams({ leadId: 'lead-001' })
    renderPage()

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('João Silva')).toBeVisible()
  })
})
