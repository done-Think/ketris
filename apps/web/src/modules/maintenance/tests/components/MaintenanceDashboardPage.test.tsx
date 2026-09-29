import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useSession } from 'next-auth/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useProperties } from '@modules/properties/hooks/use-properties'

import { MaintenanceDashboardPage } from '../../components/MaintenanceDashboardPage'
import {
  useCreateMaintenanceTicket,
  useDeleteMaintenanceTicket,
  useMaintenanceTicket,
  useMaintenanceTickets,
  useUpdateMaintenanceTicket,
} from '../../hooks/use-maintenance'
import type { ApiMaintenanceTicket, ApiMaintenanceTicketListItem } from '../../types/service'

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}))

vi.mock('@shared/hooks/use-dashboard-agenda-notifications', () => ({
  useDashboardAgendaNotifications: () => [],
}))

vi.mock('../../hooks/use-maintenance', () => ({
  useMaintenanceTickets: vi.fn(),
  useMaintenanceTicket: vi.fn(),
  useCreateMaintenanceTicket: vi.fn(),
  useUpdateMaintenanceTicket: vi.fn(),
  useDeleteMaintenanceTicket: vi.fn(),
}))

vi.mock('@modules/properties/hooks/use-properties', () => ({
  useProperties: vi.fn(),
}))

const listItems: ApiMaintenanceTicketListItem[] = [
  {
    id: 'MNT-0089',
    propertyId: 'p1',
    propertyTitle: 'Apt Jardins 3q',
    category: 'Hidráulica',
    priority: 'URGENTE',
    status: 'EM_ANDAMENTO',
    title: 'Vazamento na cozinha',
    openedByName: 'Bruno Oliveira',
    resolvedAt: null,
    createdAt: '2025-02-20T00:00:00.000Z',
    updatedAt: '2025-02-20T00:00:00.000Z',
  },
  {
    id: 'MNT-0088',
    propertyId: 'p2',
    propertyTitle: 'Studio Pinheiros',
    category: 'Elétrica',
    priority: 'ALTA',
    status: 'ABERTO',
    title: 'Tomada com defeito',
    openedByName: 'Mariana Souza',
    resolvedAt: null,
    createdAt: '2025-02-19T00:00:00.000Z',
    updatedAt: '2025-02-19T00:00:00.000Z',
  },
  {
    id: 'MNT-0087',
    propertyId: 'p3',
    propertyTitle: 'Casa Vila Madalena',
    category: 'Estrutural',
    priority: 'ALTA',
    status: 'EM_ANDAMENTO',
    title: 'Rachadura na parede',
    openedByName: 'Felipe Neto',
    resolvedAt: null,
    createdAt: '2025-02-18T00:00:00.000Z',
    updatedAt: '2025-02-18T00:00:00.000Z',
  },
  {
    id: 'MNT-0086',
    propertyId: 'p4',
    propertyTitle: 'Cobertura Moema',
    category: 'Pintura',
    priority: 'NORMAL',
    status: 'RESOLVIDO',
    title: 'Pintura descascando',
    openedByName: 'Aline Santos',
    resolvedAt: '2025-02-16T00:00:00.000Z',
    createdAt: '2025-02-15T00:00:00.000Z',
    updatedAt: '2025-02-16T00:00:00.000Z',
  },
]

const properties = [
  { id: 'p1', title: 'Apt Jardins 3q' },
  { id: 'p2', title: 'Studio Pinheiros' },
  { id: 'p3', title: 'Casa Vila Madalena' },
  { id: 'p4', title: 'Cobertura Moema' },
]

const fullTicket: ApiMaintenanceTicket = {
  id: 'MNT-0089',
  propertyId: 'p1',
  propertyTitle: 'Apt Jardins 3q',
  category: 'Hidráulica',
  priority: 'URGENTE',
  status: 'EM_ANDAMENTO',
  title: 'Vazamento na cozinha',
  description: 'Vazamento embaixo da pia da cozinha.',
  openedById: 'user-1',
  openedByName: 'Bruno Oliveira',
  resolvedAt: null,
  createdAt: '2025-02-20T00:00:00.000Z',
  updatedAt: '2025-02-20T00:00:00.000Z',
  activities: [],
  attachments: [],
}

function mockDefaults() {
  vi.mocked(useSession).mockReturnValue({
    data: { tenantId: 'tenant-1' },
    status: 'authenticated',
    update: vi.fn(),
  } as unknown as ReturnType<typeof useSession>)

  vi.mocked(useMaintenanceTickets).mockReturnValue({
    data: { items: listItems, totalCount: listItems.length },
    isLoading: false,
  } as unknown as ReturnType<typeof useMaintenanceTickets>)

  vi.mocked(useMaintenanceTicket).mockImplementation(
    (_tenantId, ticketId) =>
      ({
        data: ticketId === fullTicket.id ? fullTicket : undefined,
        isLoading: false,
      }) as unknown as ReturnType<typeof useMaintenanceTicket>,
  )

  vi.mocked(useProperties).mockReturnValue({
    data: properties,
  } as unknown as ReturnType<typeof useProperties>)

  vi.mocked(useCreateMaintenanceTicket).mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(fullTicket),
    isPending: false,
  } as unknown as ReturnType<typeof useCreateMaintenanceTicket>)

  vi.mocked(useUpdateMaintenanceTicket).mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(fullTicket),
    isPending: false,
  } as unknown as ReturnType<typeof useUpdateMaintenanceTicket>)

  vi.mocked(useDeleteMaintenanceTicket).mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
  } as unknown as ReturnType<typeof useDeleteMaintenanceTicket>)
}

describe('MaintenanceDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDefaults()
  })

  it('renders tickets mapped from the API list', () => {
    render(<MaintenanceDashboardPage />)

    expect(screen.getByText('MNT-0089')).toBeVisible()
    expect(screen.getByText('Apt Jardins 3q')).toBeVisible()
    expect(screen.getByText('Hidráulica')).toBeVisible()
    expect(screen.getByText('Bruno Oliveira')).toBeVisible()
    expect(screen.getAllByText('Em andamento').length).toBeGreaterThan(0)
  })

  it('computes the open and urgent metric cards from the loaded tickets', () => {
    render(<MaintenanceDashboardPage />)

    const openCard = screen.getByText('Abertos').closest('div')!.parentElement!
    expect(openCard).toHaveTextContent('1')

    const urgentCard = screen.getByText('Urgentes').closest('div')!.parentElement!
    expect(urgentCard).toHaveTextContent('1')

    expect(screen.getByText('1.0 dias')).toBeVisible()
  })

  it('filters tickets by property', async () => {
    const user = userEvent.setup()
    render(<MaintenanceDashboardPage />)

    const [propertySelect] = screen.getAllByRole('combobox')
    await user.click(propertySelect)
    await user.click(await screen.findByRole('option', { name: 'Casa Vila Madalena' }))

    expect(screen.getByText('MNT-0087')).toBeVisible()
    expect(screen.queryByText('MNT-0089')).not.toBeInTheDocument()
  })

  it('filters tickets by status', async () => {
    const user = userEvent.setup()
    render(<MaintenanceDashboardPage />)

    await user.click(screen.getByRole('button', { name: /^Aberto/ }))

    expect(screen.getByText('MNT-0088')).toBeVisible()
    expect(screen.queryByText('MNT-0089')).not.toBeInTheDocument()
  })

  it('creates a ticket through the mutation and closes the dialog on success', async () => {
    const user = userEvent.setup()
    render(<MaintenanceDashboardPage />)

    const createMutation = vi.mocked(useCreateMaintenanceTicket).mock.results[0].value

    await user.click(screen.getByRole('button', { name: 'Novo Chamado' }))
    await user.click(screen.getByLabelText('Imóvel'))
    await user.click(await screen.findByRole('option', { name: 'Apt Jardins 3q' }))
    await user.click(screen.getByLabelText('Categoria'))
    await user.click(await screen.findByRole('option', { name: 'Hidráulica' }))
    await user.type(screen.getByLabelText('Título do Chamado'), 'Vazamento na cozinha')
    await user.type(screen.getByLabelText('Relato do Problema'), 'A pia está vazando.')
    await user.click(screen.getByRole('button', { name: 'Criar Chamado' }))

    await waitFor(() =>
      expect(createMutation.mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ propertyId: 'p1', category: 'Hidráulica' }),
      ),
    )
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Novo Chamado' })).not.toBeInTheDocument()
    })
  })

  it('prefills the edit dialog from the fetched ticket and saves through the update mutation', async () => {
    const user = userEvent.setup()
    render(<MaintenanceDashboardPage />)

    await user.click(screen.getByRole('button', { name: 'Ações do chamado MNT-0089' }))
    await user.click(screen.getByRole('menuitem', { name: 'Editar chamado' }))

    expect(await screen.findByLabelText('Título do Chamado')).toHaveValue('Vazamento na cozinha')

    const updateMutation = vi.mocked(useUpdateMaintenanceTicket).mock.results[0].value
    await user.click(screen.getByRole('button', { name: 'Salvar Alterações' }))

    await waitFor(() =>
      expect(updateMutation.mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'MNT-0089' }),
      ),
    )
  })

  it('deletes a ticket after confirmation', async () => {
    const user = userEvent.setup()
    render(<MaintenanceDashboardPage />)

    const deleteMutation = vi.mocked(useDeleteMaintenanceTicket).mock.results[0].value

    await user.click(screen.getByRole('button', { name: 'Ações do chamado MNT-0089' }))
    await user.click(screen.getByRole('menuitem', { name: 'Excluir chamado' }))
    await user.click(screen.getByRole('button', { name: 'Excluir chamado' }))

    await waitFor(() => expect(deleteMutation.mutateAsync).toHaveBeenCalledWith('MNT-0089'))
  })
})
