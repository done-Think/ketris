import type { MaintenanceMutationOverrides } from '../../types/testing'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useSession } from 'next-auth/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MaintenanceTicketDetailPage } from '../../components/MaintenanceTicketDetailPage'
import {
  useAddMaintenanceTicketNote,
  useMaintenanceTicket,
  useResolveMaintenanceTicket,
  useUploadMaintenanceTicketAttachment,
  useMaintenanceOptions,
  useMaintenanceAction,
} from '../../hooks/use-maintenance'
import type { ApiMaintenanceTicket } from '../../types/service'

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}))

vi.mock('../../hooks/use-maintenance', () => ({
  useMaintenanceTicket: vi.fn(),
  useResolveMaintenanceTicket: vi.fn(),
  useAddMaintenanceTicketNote: vi.fn(),
  useUploadMaintenanceTicketAttachment: vi.fn(),
  useMaintenanceOptions: vi.fn(),
  useMaintenanceAction: vi.fn(),
}))

const mockTicket: ApiMaintenanceTicket = {
  permissions: {
    linkContract: false,
    edit: true,
    collaborate: true,
    assume: false,
    assign: false,
    provider: true,
    requestReplacement: false,
    start: false,
    complete: true,
    confirm: false,
    contest: false,
    cancel: false,
    reopen: false,
    delete: false,
    restore: false,
  },
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

function mockMutations(overrides: MaintenanceMutationOverrides = {}) {
  vi.mocked(useMaintenanceOptions).mockReturnValue({
    data: { contracts: [], users: [] },
  } as unknown as ReturnType<typeof useMaintenanceOptions>)
  vi.mocked(useMaintenanceAction).mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(mockTicket),
    isPending: false,
  } as unknown as ReturnType<typeof useMaintenanceAction>)
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

  vi.mocked(useUploadMaintenanceTicketAttachment).mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(mockTicket.attachments[0]),
    isPending: false,
    ...overrides.uploadAttachment,
  } as unknown as ReturnType<typeof useUploadMaintenanceTicketAttachment>)
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

  it.each(['RESOLVIDO', 'FECHADO'] as const)(
    'requires explicit contract selection for archived %s tickets and filters other properties',
    async (status) => {
      mockTicketQuery({
        data: {
          ...mockTicket,
          status,
          deletedAt: '2026-10-01T10:00:00.000Z',
          contractId: null,
          permissions: {
            ...mockTicket.permissions!,
            linkContract: true,
            edit: false,
            collaborate: false,
          },
        },
      })
      vi.mocked(useMaintenanceOptions).mockReturnValue({
        data: {
          users: [],
          contracts: ['contract-1', 'contract-2', 'another-property'].map((id) => ({
            id,
            code: id,
            propertyId: id === 'another-property' ? 'p2' : 'p1',
            propertyTitle: 'Apt Jardins 3q',
            agentId: 'agent',
            ownerId: null,
            renterIds: [],
            parties: [],
          })),
        },
      } as unknown as ReturnType<typeof useMaintenanceOptions>)
      const user = userEvent.setup()
      render(<MaintenanceTicketDetailPage ticketId="MNT-0089" />)
      const actionMutation = vi.mocked(useMaintenanceAction).mock.results[0].value
      await user.click(screen.getByRole('button', { name: 'Associar contrato' }))
      expect(screen.getByRole('button', { name: 'Confirmar' })).toBeDisabled()
      expect(actionMutation.mutateAsync).not.toHaveBeenCalled()
      await user.click(screen.getByRole('combobox', { name: /Contrato do chamado/ }))
      expect(screen.queryByRole('option', { name: /another-property/ })).not.toBeInTheDocument()
      expect(screen.getByRole('option', { name: /contract-1/ })).toBeVisible()
      await user.click(screen.getByRole('option', { name: /contract-2/ }))
      await user.click(screen.getByRole('button', { name: 'Confirmar' }))
      await waitFor(() =>
        expect(actionMutation.mutateAsync).toHaveBeenCalledWith({
          action: 'linkContract',
          contractId: 'contract-2',
        }),
      )
    },
  )

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

  it('completes service through the action mutation after confirmation', async () => {
    const user = userEvent.setup()
    render(<MaintenanceTicketDetailPage ticketId="MNT-0089" />)

    const actionMutation = vi.mocked(useMaintenanceAction).mock.results[0].value

    await user.click(screen.getByRole('button', { name: 'Concluir atendimento' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar' }))

    await waitFor(() =>
      expect(actionMutation.mutateAsync).toHaveBeenCalledWith({ action: 'complete' }),
    )
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

  it('enables provider assignment when the API grants permission', () => {
    render(<MaintenanceTicketDetailPage ticketId="MNT-0089" />)

    expect(screen.getByRole('button', { name: 'Definir prestador' })).toBeEnabled()
  })

  it('hides provider controls and blocks collaboration when API denies permission', () => {
    mockTicketQuery({
      data: {
        ...mockTicket,
        permissions: {
          ...mockTicket.permissions!,
          provider: false,
          collaborate: false,
          complete: false,
        },
      },
    })
    render(<MaintenanceTicketDetailPage ticketId="MNT-0089" />)
    expect(screen.queryByRole('button', { name: 'Definir prestador' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Associar contrato' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Anexar arquivos' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Enviar Mensagem' })).toBeDisabled()
  })

  it('uploads a file through the attach-files button and the hidden file input', async () => {
    const user = userEvent.setup()
    render(<MaintenanceTicketDetailPage ticketId="MNT-0089" />)

    const uploadMutation = vi.mocked(useUploadMaintenanceTicketAttachment).mock.results[0].value
    const file = new File(['conteudo'], 'foto.jpg', { type: 'image/jpeg' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    await user.upload(input, file)

    await waitFor(() => expect(uploadMutation.mutateAsync).toHaveBeenCalledWith(file))
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
