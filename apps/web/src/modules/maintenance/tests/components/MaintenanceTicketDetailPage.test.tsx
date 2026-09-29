import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useSession } from 'next-auth/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MaintenanceTicketDetailPage } from '../../components/MaintenanceTicketDetailPage'
import {
  useAddMaintenanceTicketNote,
  useMaintenanceTicket,
  useResolveMaintenanceTicket,
} from '../../hooks/use-maintenance'
import type { ApiMaintenanceTicket } from '../../types/service'

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}))

vi.mock('../../hooks/use-maintenance', () => ({
  useMaintenanceTicket: vi.fn(),
  useResolveMaintenanceTicket: vi.fn(),
  useAddMaintenanceTicketNote: vi.fn(),
}))

const mockTicket: ApiMaintenanceTicket = {
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
  createdAt: '2025-02-20T10:15:00.000Z',
  updatedAt: '2025-02-20T14:00:00.000Z',
  activities: [
    {
      id: 'a1',
      ticketId: 'MNT-0089',
      type: 'NOTA',
      message: 'Abri o chamado.',
      authorId: 'user-1',
      authorName: 'Bruno Oliveira',
      createdAt: '2025-02-20T10:15:00.000Z',
    },
    {
      id: 'a2',
      ticketId: 'MNT-0089',
      type: 'NOTA',
      message: 'Já aprovei a solicitação.',
      authorId: 'user-2',
      authorName: 'Marina Costa',
      createdAt: '2025-02-20T11:30:00.000Z',
    },
  ],
  attachments: [
    {
      id: 'att1',
      ticketId: 'MNT-0089',
      name: 'pia_cozinha1.jpg',
      url: 'https://example.com/pia_cozinha1.jpg',
      createdAt: '2025-02-20T10:15:00.000Z',
    },
  ],
}

function mockSession() {
  vi.mocked(useSession).mockReturnValue({
    data: { tenantId: 'tenant-1' },
    status: 'authenticated',
    update: vi.fn(),
  } as unknown as ReturnType<typeof useSession>)
}

function mockTicketQuery(overrides: Partial<ReturnType<typeof useMaintenanceTicket>> = {}) {
  vi.mocked(useMaintenanceTicket).mockReturnValue({
    data: mockTicket,
    isLoading: false,
    ...overrides,
  } as unknown as ReturnType<typeof useMaintenanceTicket>)
}

function mockMutations(
  overrides: {
    resolve?: Record<string, unknown>
    addNote?: Record<string, unknown>
  } = {},
) {
  vi.mocked(useResolveMaintenanceTicket).mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(mockTicket),
    isPending: false,
    ...overrides.resolve,
  } as unknown as ReturnType<typeof useResolveMaintenanceTicket>)

  vi.mocked(useAddMaintenanceTicketNote).mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(mockTicket.activities[0]),
    isPending: false,
    ...overrides.addNote,
  } as unknown as ReturnType<typeof useAddMaintenanceTicketNote>)
}

describe('MaintenanceTicketDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSession()
    mockTicketQuery()
    mockMutations()
  })

  it('renders the ticket header, description and property details from the API', () => {
    render(<MaintenanceTicketDetailPage ticketId="MNT-0089" />)

    expect(screen.getByText('MNT-0089')).toBeVisible()
    expect(screen.getByText('Vazamento na cozinha')).toBeVisible()
    expect(screen.getByText('Em andamento')).toBeVisible()
    expect(screen.getByText('Urgente')).toBeVisible()
    expect(screen.getByText('Apt Jardins 3q')).toBeVisible()
    expect(screen.getByText('Hidráulica')).toBeVisible()
    expect(screen.getByText('Vazamento embaixo da pia da cozinha.')).toBeVisible()
  })

  it('renders attached photos from ticket.attachments and nothing when there are none', () => {
    const { unmount } = render(<MaintenanceTicketDetailPage ticketId="MNT-0089" />)
    expect(screen.getByText('pia_cozinha1.jpg')).toBeVisible()
    unmount()

    mockTicketQuery({ data: { ...mockTicket, attachments: [] } } as never)
    render(<MaintenanceTicketDetailPage ticketId="MNT-0089" />)
    expect(screen.queryByText('pia_cozinha1.jpg')).not.toBeInTheDocument()
    expect(screen.getByText('Nenhuma foto anexada a este chamado.')).toBeVisible()
  })

  it('renders the timeline from ticket.activities', () => {
    render(<MaintenanceTicketDetailPage ticketId="MNT-0089" />)

    expect(screen.getByText('Abri o chamado.')).toBeVisible()
    expect(screen.getByText('Já aprovei a solicitação.')).toBeVisible()
    expect(screen.getByText('Marina Costa')).toBeVisible()
  })

  it('marks the ticket as resolved through the resolve mutation', async () => {
    const user = userEvent.setup()
    render(<MaintenanceTicketDetailPage ticketId="MNT-0089" />)

    const resolveMutation = vi.mocked(useResolveMaintenanceTicket).mock.results[0].value

    await user.click(screen.getByRole('button', { name: 'Marcar resolvido' }))

    await waitFor(() => expect(resolveMutation.mutateAsync).toHaveBeenCalled())
  })

  it('sends a note through the add-note mutation and clears the field on success', async () => {
    const user = userEvent.setup()
    render(<MaintenanceTicketDetailPage ticketId="MNT-0089" />)

    const addNoteMutation = vi.mocked(useAddMaintenanceTicketNote).mock.results[0].value
    const textbox = screen.getByPlaceholderText(
      'Escreva uma mensagem ou atualização sobre o chamado...',
    )

    await user.type(textbox, 'Visita agendada para amanhã.')
    await user.click(screen.getByRole('button', { name: 'Enviar Mensagem' }))

    await waitFor(() =>
      expect(addNoteMutation.mutateAsync).toHaveBeenCalledWith('Visita agendada para amanhã.'),
    )
    await waitFor(() => expect(textbox).toHaveValue(''))
  })

  it('disables assign-provider and attach-files since there is no backend support yet', () => {
    render(<MaintenanceTicketDetailPage ticketId="MNT-0089" />)

    expect(screen.getByRole('button', { name: 'Atribuir prestador' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Anexar arquivos' })).toBeDisabled()
  })

  it('renders a loading state while the ticket is being fetched', () => {
    mockTicketQuery({ data: undefined, isLoading: true } as never)
    render(<MaintenanceTicketDetailPage ticketId="MNT-0089" />)

    expect(screen.getByText('Carregando chamado...')).toBeVisible()
  })

  it('renders a not-found state for an unknown ticket id', () => {
    mockTicketQuery({ data: undefined, isLoading: false } as never)
    render(<MaintenanceTicketDetailPage ticketId="MNT-9999" />)

    expect(screen.getByText('Chamado não encontrado')).toBeVisible()
  })
})
