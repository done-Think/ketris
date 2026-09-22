import { ThemeProvider } from '@mui/material'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useSession } from 'next-auth/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'

import { LeadsDashboardPage } from '../../components/LeadsDashboardPage'
import {
  useConvertLeadToOpportunity,
  useCreateLead,
  useLeads,
  useUpdateLeadStage,
} from '../../hooks/use-leads'
import type { Lead } from '../../types/lead'

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}))

vi.mock('@shared/hooks/use-dashboard-agenda-notifications', () => ({
  useDashboardAgendaNotifications: () => [],
}))

vi.mock('../../hooks/use-leads', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../hooks/use-leads')>()

  return {
    ...original,
    useLeads: vi.fn(),
    useCreateLead: vi.fn(),
    useUpdateLeadStage: vi.fn(),
    useConvertLeadToOpportunity: vi.fn(),
  }
})

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

function makeLead(index: number, overrides: Partial<Lead> = {}): Lead {
  return {
    id: `lead-00${index}`,
    tenantId: 'tenant-1',
    responsavelId: 'agent-1',
    name: `Lead ${index}`,
    phone: `(11) 9000${index}-000${index}`,
    email: `lead${index}@email.com`,
    interest: `Interesse ${index}`,
    budget: 'R$ 1M',
    source: 'Marketplace',
    stage: 'NOVO',
    notes: null,
    opportunityId: null,
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
    ...overrides,
  }
}

const leadFixtures: Lead[] = [
  makeLead(1, { name: 'João Silva', email: 'joao.silva@email.com', stage: 'NOVO' }),
  makeLead(2, { name: 'Maria Fernandes', stage: 'EM_CONTATO' }),
  makeLead(3, { name: 'Rafael Lima', stage: 'VISITA_MARCADA' }),
  makeLead(4, { name: 'Carla Rocha', stage: 'PROPOSTA' }),
  makeLead(5, { name: 'Guilherme Santos', stage: 'NOVO' }),
  makeLead(6, { name: 'Patrícia Lima', stage: 'EM_CONTATO' }),
]

function mockLeadsQuery(overrides: Record<string, unknown> = {}) {
  vi.mocked(useLeads).mockReturnValue({
    data: leadFixtures,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useLeads>)
}

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
    vi.mocked(useSession).mockReturnValue({
      data: { tenantId: 'tenant-1' },
      status: 'authenticated',
    } as unknown as ReturnType<typeof useSession>)
    mockLeadsQuery()
    vi.mocked(useCreateLead).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateLead>)
    vi.mocked(useUpdateLeadStage).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateLeadStage>)
    vi.mocked(useConvertLeadToOpportunity).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useConvertLeadToOpportunity>)
  })

  it('opens the create lead dialog from the header button', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Novo Lead' }))

    expect(screen.getByRole('dialog', { name: /Registrar lead/ })).toBeVisible()
  })

  it('submits the create lead form calling the create mutation with the right payload', async () => {
    const user = userEvent.setup()
    const mutate = vi.fn()
    vi.mocked(useCreateLead).mockReturnValue({
      mutate,
      isPending: false,
    } as unknown as ReturnType<typeof useCreateLead>)
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Novo Lead' }))
    await user.type(screen.getByLabelText('Nome'), 'Fernanda Alves')
    await user.type(screen.getByLabelText('Telefone'), '11977776666')
    await user.click(screen.getByRole('button', { name: 'Próximo' }))
    await user.type(screen.getByLabelText('Imóvel ou interesse'), 'Casa Morumbi')
    await user.type(screen.getByLabelText('Orçamento'), 'R$ 1.2M')
    await user.click(screen.getByRole('button', { name: 'Próximo' }))
    await user.click(screen.getByRole('button', { name: 'Criar lead' }))

    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Fernanda Alves', interest: 'Casa Morumbi' }),
      expect.anything(),
    )
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

    const filterGroup = screen.getByRole('group', { name: 'Filtrar leads por status' })
    await user.click(within(filterGroup).getByRole('button', { name: /^Novo/ }))

    expect(screen.getAllByText('João Silva').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Guilherme Santos').length).toBeGreaterThan(0)
    expect(screen.queryAllByText('Maria Fernandes')).toHaveLength(0)
  })

  it('navigates between pages using the numbered pagination', async () => {
    const user = userEvent.setup()
    renderPage()

    expect(screen.queryAllByText('Patrícia Lima')).toHaveLength(0)

    await user.click(screen.getByRole('button', { name: 'Ir para a página 2' }))

    expect(screen.getAllByText('Patrícia Lima').length).toBeGreaterThan(0)
    expect(screen.queryAllByText('João Silva')).toHaveLength(0)
  })

  it('opens the contact dialog for the lead referenced by the leadId query param', () => {
    mocks.searchParams = new URLSearchParams({ leadId: 'lead-001' })
    renderPage()

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('João Silva')).toBeVisible()
  })

  it('calls the update-stage mutation when a stage is changed from the contact dialog', async () => {
    const user = userEvent.setup()
    const mutate = vi.fn()
    vi.mocked(useUpdateLeadStage).mockReturnValue({
      mutate,
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateLeadStage>)
    renderPage()

    const table = screen.getByRole('table', { name: 'Leads do CRM' })
    const row = within(table).getByText('João Silva').closest('tr')
    await user.click(within(row as HTMLElement).getByRole('button', { name: 'Contato' }))

    await user.click(screen.getByLabelText('Estágio'))
    await user.click(await screen.findByRole('option', { name: 'Em contato' }))

    expect(mutate).toHaveBeenCalledWith({ leadId: 'lead-001', stage: 'EM_CONTATO' })
  })
})
