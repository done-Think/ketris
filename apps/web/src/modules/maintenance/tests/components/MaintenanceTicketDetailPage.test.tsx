import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useSession } from 'next-auth/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { MaintenanceMutationOverrides } from '../../types/testing'

import { MaintenanceTicketDetailPage } from '../../components/MaintenanceTicketDetailPage'
import {
  useAddMaintenanceTicketNote,
  useMaintenanceAction,
  useMaintenanceOptions,
  useMaintenanceTicket,
  useResolveMaintenanceTicket,
  useUploadMaintenanceTicketAttachment,
} from '../../hooks/use-maintenance'
import type { ApiMaintenanceTicket } from '../../types/service'

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}))

vi.mock('../../hooks/use-maintenance-providers', () => ({
  useMaintenanceProviderOptions: () => ({ data: { pages: [] }, isLoading: false }),
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
    schedule: false,
    edit: true,
    collaborate: true,
    comment: true,
    assume: false,
    assign: false,
    provider: true,
    requestReplacement: false,
    start: false,
    complete: true,
    finish: false,
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
  category: 'PLUMBING',
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

function mockSession(role: 'OWNER' | 'RENTER' = 'OWNER') {
  vi.mocked(useSession).mockReturnValue({
    data: { tenantId: 'tenant-1', role },
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

  it('keeps scheduling disabled without a provider and enables it after assignment', async () => {
    mockSession('RENTER')
    mockTicketQuery({ data: { ...mockTicket, provider: null } })
    const { rerender } = render(<MaintenanceTicketDetailPage ticketId="MNT-0089" />)
    expect(screen.getByLabelText('Data do atendimento')).toBeDisabled()
    expect(screen.getByRole('combobox', { name: 'Hora (24h)' })).toBeDisabled()
    expect(screen.getByRole('combobox', { name: 'Minuto' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Salvar data' })).toBeDisabled()
    expect(screen.getByText('Defina um prestador para liberar o agendamento.')).toBeVisible()
    expect(
      screen.getByText(
        'Antes de marcar o atendimento aqui, combine a data e o horário com o prestador selecionado.',
      ),
    ).toBeVisible()
    mockTicketQuery({
      data: {
        ...mockTicket,
        provider: { name: 'Selected provider' },
        permissions: { ...mockTicket.permissions!, schedule: true, edit: false },
      },
    })
    rerender(<MaintenanceTicketDetailPage ticketId="MNT-0089" />)
    const input = screen.getByLabelText('Data do atendimento')
    const hour = screen.getByRole('combobox', { name: 'Hora (24h)' })
    const minute = screen.getByRole('combobox', { name: 'Minuto' })
    expect(input).toBeEnabled()
    expect(hour).toBeEnabled()
    expect(minute).toBeEnabled()
    await userEvent.click(screen.getByRole('button', { name: 'Salvar data' }))
    expect(await screen.findAllByText('Informe a data e o horário do atendimento.')).toHaveLength(3)
    const mutation = vi.mocked(useMaintenanceAction).mock.results[0].value.mutateAsync
    expect(mutation).not.toHaveBeenCalled()
    fireEvent.change(input, { target: { value: '2026-10-24' } })
    await userEvent.selectOptions(hour, '14')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar data' }))
    expect(mutation).not.toHaveBeenCalled()
    await userEvent.selectOptions(minute, '23')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar data' }))
    await waitFor(() =>
      expect(mutation).toHaveBeenCalledWith({
        action: 'schedule',
        scheduledAt: new Date('2026-10-24T14:23').toISOString(),
      }),
    )
  })

  it('loads the scheduled date and time separately and refreshes them after rescheduling', () => {
    const scheduledAt = new Date(2026, 9, 24, 0, 5).toISOString()
    mockTicketQuery({ data: { ...mockTicket, scheduledAt } })
    const { rerender } = render(<MaintenanceTicketDetailPage ticketId="MNT-0089" />)
    expect(screen.getByLabelText('Data do atendimento')).toHaveValue('2026-10-24')
    expect(screen.getByRole('combobox', { name: 'Hora (24h)' })).toHaveValue('00')
    expect(screen.getByRole('combobox', { name: 'Minuto' })).toHaveValue('05')

    mockTicketQuery({
      data: { ...mockTicket, scheduledAt: new Date(2026, 9, 25, 23, 59).toISOString() },
    })
    rerender(<MaintenanceTicketDetailPage ticketId="MNT-0089" />)
    expect(screen.getByLabelText('Data do atendimento')).toHaveValue('2026-10-25')
    expect(screen.getByRole('combobox', { name: 'Hora (24h)' })).toHaveValue('23')
    expect(screen.getByRole('combobox', { name: 'Minuto' })).toHaveValue('59')
  })

  it('lets a linked renter comment and attach images without management actions', async () => {
    mockSession('RENTER')
    mockTicketQuery({
      data: {
        ...mockTicket,
        permissions: { ...mockTicket.permissions!, edit: false, provider: false, complete: false },
      },
    })
    const user = userEvent.setup()
    render(<MaintenanceTicketDetailPage ticketId="MNT-0089" />)
    expect(
      screen.queryByRole('button', {
        name: /Assumir chamado|Atribuir responsável|Definir prestador|Concluir atendimento|Confirmar resolução|Contestar resolução|Cancelar chamado/,
      }),
    ).not.toBeInTheDocument()
    const file = new File(['image'], 'repair.png', { type: 'image/png' })
    await user.upload(document.querySelector('input[type="file"]') as HTMLInputElement, file)
    expect(
      vi.mocked(useUploadMaintenanceTicketAttachment).mock.results[0].value.mutateAsync,
    ).toHaveBeenCalledWith(file)
    await user.type(
      screen.getByPlaceholderText('Escreva uma mensagem ou atualização sobre o chamado...'),
      'The leak is still visible.',
    )
    await user.click(screen.getByRole('button', { name: 'Enviar Mensagem' }))
    expect(
      vi.mocked(useAddMaintenanceTicketNote).mock.results[0].value.mutateAsync,
    ).toHaveBeenCalledWith('The leak is still visible.')
  })

  it.each(['CANCELADO', 'FECHADO'] as const)(
    'keeps %s tickets readable and blocks renter collaboration',
    (status) => {
      mockSession('RENTER')
      mockTicketQuery({
        data: {
          ...mockTicket,
          status,
          permissions: {
            ...mockTicket.permissions!,
            edit: false,
            provider: false,
            complete: false,
            collaborate: false,
            comment: false,
          },
        },
      })
      render(<MaintenanceTicketDetailPage ticketId="MNT-0089" />)
      expect(
        screen.getByText('Este chamado está encerrado e disponível somente para consulta.'),
      ).toBeVisible()
      expect(screen.getByText('Abri o chamado.')).toBeVisible()
      expect(screen.getByText('pia_cozinha1.jpg')).toBeVisible()
      expect(screen.getByRole('button', { name: 'Anexar arquivos' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Enviar Mensagem' })).toBeDisabled()
      expect(
        screen.queryByRole('button', {
          name: /Confirmar resolução|Contestar resolução|Concluir atendimento/,
        }),
      ).not.toBeInTheDocument()
    },
  )

  it('lets a renter add notes after resolution without enabling attachments or editing original information', async () => {
    mockSession('RENTER')
    mockTicketQuery({
      data: {
        ...mockTicket,
        status: 'RESOLVIDO',
        permissions: {
          ...mockTicket.permissions!,
          edit: false,
          comment: true,
          collaborate: false,
          provider: false,
          complete: false,
          reopen: true,
        },
      },
    })
    const user = userEvent.setup()
    render(<MaintenanceTicketDetailPage ticketId="MNT-0089" />)
    expect(screen.getByText(/Você pode acrescentar notas ou reabrir este chamado/)).toBeVisible()
    expect(screen.getByText(mockTicket.description)).toBeVisible()
    expect(screen.getByText('Abri o chamado.')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Anexar arquivos' })).toBeDisabled()
    await user.type(
      screen.getByPlaceholderText('Escreva uma mensagem ou atualização sobre o chamado...'),
      'Extra detail after resolution',
    )
    await user.click(screen.getByRole('button', { name: 'Enviar Mensagem' }))
    expect(
      vi.mocked(useAddMaintenanceTicketNote).mock.results[0].value.mutateAsync,
    ).toHaveBeenCalledWith('Extra detail after resolution')
  })
  it('requires a reason when the renter reopens and does not offer a target status', async () => {
    mockSession('RENTER')
    mockTicketQuery({
      data: {
        ...mockTicket,
        status: 'RESOLVIDO',
        permissions: {
          ...mockTicket.permissions!,
          edit: false,
          comment: true,
          collaborate: false,
          provider: false,
          complete: false,
          reopen: true,
        },
      },
    })
    const user = userEvent.setup()
    render(<MaintenanceTicketDetailPage ticketId="MNT-0089" />)
    await user.click(screen.getByRole('button', { name: 'Reabrir chamado' }))
    expect(screen.queryByLabelText('Status de reabertura')).not.toBeInTheDocument()
    const confirm = screen.getByRole('button', { name: 'Confirmar' })
    expect(confirm).toBeDisabled()
    await user.type(screen.getByRole('textbox', { name: /Justificativa/ }), '   ')
    expect(confirm).toBeDisabled()
    await user.type(screen.getByRole('textbox', { name: /Justificativa/ }), 'Leak returned')
    await user.click(confirm)
    await waitFor(() =>
      expect(
        vi.mocked(useMaintenanceAction).mock.results[0].value.mutateAsync,
      ).toHaveBeenCalledWith({ action: 'reopen', status: 'ABERTO', reason: 'Leak returned' }),
    )
  })
  it('lets a linked renter contest with a mandatory reason while confirmation stays unavailable', async () => {
    mockSession('RENTER')
    mockTicketQuery({
      data: {
        ...mockTicket,
        status: 'AGUARDANDO_CONFIRMACAO',
        permissions: {
          ...mockTicket.permissions!,
          edit: false,
          provider: false,
          complete: false,
          contest: true,
        },
      },
    })
    const user = userEvent.setup()
    render(<MaintenanceTicketDetailPage ticketId="MNT-0089" />)
    expect(
      screen.getByText(/Se o problema foi resolvido, você pode finalizar o chamado/),
    ).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Confirmar resolução' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Contestar resolução' }))
    const save = screen.getByRole('button', { name: 'Confirmar' })
    expect(save).toBeDisabled()
    await user.type(screen.getByRole('textbox', { name: /Justificativa/ }), '   ')
    expect(save).toBeDisabled()
    await user.type(screen.getByRole('textbox', { name: /Justificativa/ }), 'Still leaking')
    await user.click(save)
    await waitFor(() =>
      expect(
        vi.mocked(useMaintenanceAction).mock.results[0].value.mutateAsync,
      ).toHaveBeenCalledWith({ action: 'contest', reason: 'Still leaking' }),
    )
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
    expect(screen.getByText('Atendimento agendado')).toBeVisible()
    expect(screen.getByText('Ainda não agendado')).toBeVisible()
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

  it.each(['ABERTO', 'EM_ANDAMENTO', 'AGUARDANDO_CONFIRMACAO', 'CONTESTADO'] as const)(
    'lets a renter finish a %s ticket after confirming the problem is resolved',
    async (status) => {
      mockSession('RENTER')
      mockTicketQuery({
        data: {
          ...mockTicket,
          status,
          permissions: {
            ...mockTicket.permissions!,
            finish: true,
            edit: false,
            provider: false,
            complete: false,
          },
        },
      })
      const user = userEvent.setup()
      render(<MaintenanceTicketDetailPage ticketId="MNT-0089" />)
      expect(screen.queryByRole('button', { name: 'Concluir atendimento' })).not.toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'Finalizar chamado' }))
      expect(screen.getByText(/Você confirma que o problema foi resolvido/)).toBeVisible()
      const mutation = vi.mocked(useMaintenanceAction).mock.results[0].value.mutateAsync
      expect(mutation).not.toHaveBeenCalled()
      await user.click(screen.getByRole('button', { name: 'Confirmar' }))
      await waitFor(() => expect(mutation).toHaveBeenCalledWith({ action: 'finish' }))
    },
  )
  it('does not finish a ticket when the renter dismisses the confirmation', async () => {
    mockSession('RENTER')
    mockTicketQuery({
      data: {
        ...mockTicket,
        status: 'ABERTO',
        permissions: {
          ...mockTicket.permissions!,
          finish: true,
          edit: false,
          provider: false,
          complete: false,
        },
      },
    })
    const user = userEvent.setup()
    render(<MaintenanceTicketDetailPage ticketId="MNT-0089" />)
    await user.click(screen.getByRole('button', { name: 'Finalizar chamado' }))
    await user.keyboard('{Escape}')
    expect(vi.mocked(useMaintenanceAction).mock.results[0].value.mutateAsync).not.toHaveBeenCalled()
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
  it('lets the renter open and submit the existing provider modal', async () => {
    mockSession('RENTER')
    mockTicketQuery({
      data: {
        ...mockTicket,
        permissions: {
          ...mockTicket.permissions!,
          provider: true,
          edit: false,
          complete: false,
        },
      },
    })
    const user = userEvent.setup()
    render(<MaintenanceTicketDetailPage ticketId="MNT-0089" />)
    await user.click(screen.getByRole('button', { name: 'Definir prestador' }))
    const confirm = screen.getByRole('button', { name: 'Confirmar' })
    expect(confirm).toBeDisabled()
    await user.type(
      screen.getByLabelText('Nome da pessoa ou empresa', { exact: false }),
      'Chosen professional',
    )
    await user.type(screen.getByLabelText('Telefone'), '51999990000')
    await user.type(screen.getByLabelText('E-mail'), 'professional@example.test')
    await user.type(screen.getByLabelText('Observações'), 'Plumbing services')
    await user.click(confirm)
    await waitFor(() =>
      expect(
        vi.mocked(useMaintenanceAction).mock.results[0].value.mutateAsync,
      ).toHaveBeenCalledWith({
        action: 'provider',
        provider: {
          name: 'Chosen professional',
          phone: '51999990000',
          email: 'professional@example.test',
          notes: 'Plumbing services',
        },
      }),
    )
  })

  it('hides provider controls and blocks collaboration when API denies permission', () => {
    mockTicketQuery({
      data: {
        ...mockTicket,
        permissions: {
          ...mockTicket.permissions!,
          provider: false,
          collaborate: false,
          comment: false,
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
    mockTicketQuery({
      data: undefined,
      isLoading: false,
      error: { isAxiosError: true, response: { status: 404 } },
    } as never)
    render(<MaintenanceTicketDetailPage ticketId="MNT-9999" />)

    expect(screen.getByText('Chamado não encontrado')).toBeVisible()
  })

  it('retries a server failure without presenting a missing ticket', async () => {
    const refetch = vi.fn()
    mockTicketQuery({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { isAxiosError: true, response: { status: 500 } },
      refetch,
    } as never)
    render(<MaintenanceTicketDetailPage ticketId="MNT-0089" />)
    expect(screen.queryByText('Chamado não encontrado')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(refetch).toHaveBeenCalledOnce()
  })

  it('preserves an unsaved schedule through a background refetch', async () => {
    const editable = {
      ...mockTicket,
      provider: { name: 'Selected provider' },
      permissions: { ...mockTicket.permissions!, schedule: true },
      scheduledAt: new Date(2026, 9, 24, 10, 0).toISOString(),
    }
    mockTicketQuery({ data: editable })
    const { rerender } = render(<MaintenanceTicketDetailPage ticketId="MNT-0089" />)
    fireEvent.change(screen.getByLabelText('Data do atendimento'), {
      target: { value: '2026-11-02' },
    })
    mockTicketQuery({
      data: { ...editable, scheduledAt: new Date(2026, 9, 25, 12, 30).toISOString() },
    })
    rerender(<MaintenanceTicketDetailPage ticketId="MNT-0089" />)
    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: 'Hora (24h)' })).toHaveValue('12'),
    )
    expect(screen.getByLabelText('Data do atendimento')).toHaveValue('2026-11-02')
  })
})
