import { useAgendaAgents } from '../../hooks/use-agenda-agents'
import { ThemeProvider } from '@mui/material'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import dayjs from 'dayjs'
import { useSession } from 'next-auth/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'

import { useProperties } from '@modules/properties/hooks/use-properties'

import { AgendaDashboardPage } from '../../components/AgendaDashboardPage'
import { useAgendaOrganization } from '../../hooks/use-agenda-organization'
import {
  useAgendaEvents,
  useCancelAgendaEvent,
  useCreateAgendaEvent,
  useRescheduleAgendaEvent,
  useUpdateAgendaEvent,
} from '../../hooks/use-agenda-events'
import type { AgendaEventApi, RenterAgendaEventApi } from '../../types/agenda-event'

const mocks = vi.hoisted(() => ({
  enqueueSnackbar: vi.fn(),
  closeSnackbar: vi.fn(),
}))

vi.mock('notistack', () => ({
  useSnackbar: () => ({
    enqueueSnackbar: mocks.enqueueSnackbar,
    closeSnackbar: mocks.closeSnackbar,
  }),
}))

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}))

vi.mock('../../hooks/use-agenda-agents', () => ({ useAgendaAgents: vi.fn() }))
vi.mock('../../hooks/use-agenda-organization', () => ({ useAgendaOrganization: vi.fn() }))

vi.mock('../../hooks/use-agenda-events', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../hooks/use-agenda-events')>()

  return {
    ...original,
    useAgendaEvents: vi.fn(),
    useCancelAgendaEvent: vi.fn(),
    useCreateAgendaEvent: vi.fn(),
    useRescheduleAgendaEvent: vi.fn(),
    useUpdateAgendaEvent: vi.fn(),
  }
})

vi.mock('@modules/properties/hooks/use-properties', () => ({
  useProperties: vi.fn(),
}))

vi.mock('@shared/hooks/use-dashboard-agenda-notifications', () => ({
  useDashboardAgendaNotifications: () => [],
}))

const today = '2026-10-21'
const twoDaysFromNow = '2026-10-23'

function makeEvent(overrides: Partial<AgendaEventApi> = {}): AgendaEventApi {
  return {
    id: 'event-1',
    tenantId: 'tenant-1',
    responsibleId: 'user-1',
    createdById: 'user-1',
    propertyId: null,
    propertyReference: 'Apartamento Jardim Paulista',
    title: 'Visita Jardim Paulista',
    kind: 'VISIT',
    status: 'CONFIRMED',
    start: dayjs(`${today}T09:00:00`).toISOString(),
    end: dayjs(`${today}T10:00:00`).toISOString(),
    participantName: 'Ana Nóbrega',
    participantPhone: '11999990000',
    notes: 'Cliente quer validar luminosidade da sala.',
    createdAt: dayjs(`${today}T00:00:00`).toISOString(),
    updatedAt: dayjs(`${today}T00:00:00`).toISOString(),
    ...overrides,
  }
}

function mockEventsQuery(overrides: Record<string, unknown> = {}) {
  vi.mocked(useAgendaEvents).mockReturnValue({
    data: [],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useAgendaEvents>)
}

function mockCreateEvent(overrides: Record<string, unknown> = {}) {
  vi.mocked(useCreateAgendaEvent).mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(makeEvent()),
    isPending: false,
    ...overrides,
  } as unknown as ReturnType<typeof useCreateAgendaEvent>)
}

function mockRescheduleEvent(overrides: Record<string, unknown> = {}) {
  vi.mocked(useRescheduleAgendaEvent).mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(makeEvent()),
    isPending: false,
    ...overrides,
  } as unknown as ReturnType<typeof useRescheduleAgendaEvent>)
}

function mockUpdateEvent(overrides: Record<string, unknown> = {}) {
  vi.mocked(useUpdateAgendaEvent).mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(makeEvent()),
    isPending: false,
    ...overrides,
  } as unknown as ReturnType<typeof useUpdateAgendaEvent>)
}

function mockCancelEvent(overrides: Record<string, unknown> = {}) {
  vi.mocked(useCancelAgendaEvent).mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(makeEvent({ status: 'CANCELLED' })),
    isPending: false,
    ...overrides,
  } as unknown as ReturnType<typeof useCancelAgendaEvent>)
}

function mockPropertiesQuery(overrides: Record<string, unknown> = {}) {
  vi.mocked(useProperties).mockReturnValue({
    data: [],
    isLoading: false,
    isError: false,
    ...overrides,
  } as unknown as ReturnType<typeof useProperties>)
}

function renderPage() {
  return render(
    <ThemeProvider theme={theme}>
      <AgendaDashboardPage />
    </ThemeProvider>,
  )
}

describe('AgendaDashboardPage', () => {
  afterEach(() => vi.useRealTimers())
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(`${today}T13:15:34`))
    vi.clearAllMocks()
    vi.mocked(useSession).mockReturnValue({
      data: { tenantId: 'tenant-1' },
      status: 'authenticated',
      update: vi.fn(),
    } as unknown as ReturnType<typeof useSession>)
    mockEventsQuery()
    mockCreateEvent()
    mockRescheduleEvent()
    mockUpdateEvent()
    mockCancelEvent()
    mockPropertiesQuery()
    vi.mocked(useAgendaAgents).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useAgendaAgents>)
    vi.mocked(useAgendaOrganization).mockReturnValue({
      charges: { data: [], isLoading: false, isError: false },
      maintenance: { data: [], isLoading: false, isError: false },
    } as unknown as ReturnType<typeof useAgendaOrganization>)
  })

  it('renders the header and today events on the calendar', () => {
    mockEventsQuery({ data: [makeEvent()] })

    renderPage()

    expect(screen.getByRole('heading', { name: 'Agenda' })).toBeVisible()
    expect(screen.getByText('09:00 - Visita Jardim Paulista')).toBeVisible()
  })

  it('sends the chosen agent when the agency creates an internal event', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: { tenantId: 'tenant-1', role: 'ADMIN', user: { id: 'admin' } },
      status: 'authenticated',
      update: vi.fn(),
    } as unknown as ReturnType<typeof useSession>)
    vi.mocked(useAgendaAgents).mockReturnValue({
      data: [{ id: 'agent-1', name: 'Corretor Ana' }],
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useAgendaAgents>)
    const mutateAsync = vi.fn().mockResolvedValue(makeEvent())
    mockCreateEvent({ mutateAsync })
    renderPage()
    await userEvent.click(screen.getAllByRole('button', { name: 'Novo Evento' })[0])
    await userEvent.click(screen.getByRole('checkbox', { name: 'Evento interno da equipe' }))
    await userEvent.type(screen.getByLabelText('Título'), 'Planejar visitas')
    await userEvent.click(screen.getByLabelText('Destinatários'))
    await userEvent.click(screen.getByRole('option', { name: 'Corretor específico' }))
    await userEvent.click(screen.getByLabelText('Corretor'))
    await userEvent.click(screen.getByRole('option', { name: 'Corretor Ana' }))
    await userEvent.click(screen.getByRole('button', { name: 'Criar evento' }))
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1))
    expect(mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Planejar visitas',
        internal: true,
        audience: 'ASSIGNED_AGENT',
        responsibleId: 'agent-1',
        participantName: '',
        participantPhone: '',
      }),
    )
    expect(mutateAsync.mock.calls[0][0]).not.toHaveProperty('propertyId')
  })

  it('lets the assigned agent read internal event notes without editing or redirecting it', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: { tenantId: 'tenant-1', role: 'AGENT', user: { id: 'agent-1' } },
      status: 'authenticated',
      update: vi.fn(),
    } as unknown as ReturnType<typeof useSession>)
    mockEventsQuery({
      data: [
        makeEvent({
          audience: 'ASSIGNED_AGENT',
          internal: true,
          responsibleId: 'agent-1',
          notes: 'Preparar relatório da equipe',
          participantName: '',
          participantPhone: '',
        }),
      ],
    })
    renderPage()
    await userEvent.click(
      screen.getAllByRole('button', { name: 'Abrir Visita Jardim Paulista' })[0],
    )
    const dialog = within(screen.getByRole('dialog'))
    expect(dialog.getByText('Preparar relatório da equipe')).toBeVisible()
    expect(dialog.queryByRole('button', { name: /Editar|Excluir/ })).not.toBeInTheDocument()
  })

  it('shows linked renter events with the reduced API response and no management actions', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: { scope: 'tenant', tenantId: 'renters', role: 'RENTER', user: { id: 'renter-1' } },
      status: 'authenticated',
      update: vi.fn(),
    } as unknown as ReturnType<typeof useSession>)
    const event: RenterAgendaEventApi = {
      id: 'linked-event',
      title: 'Vistoria agendada',
      kind: 'INSPECTION',
      status: 'CONFIRMED',
      start: dayjs(`${today}T09:00:00`).toISOString(),
      end: dayjs(`${today}T10:00:00`).toISOString(),
      propertyId: null,
      propertyReference: 'Apartamento vinculado',
      responsibleName: 'Corretora Ana',
    }
    mockEventsQuery({ data: [event] })
    renderPage()
    expect(screen.queryByRole('button', { name: 'Novo Evento' })).not.toBeInTheDocument()
    await userEvent.click(screen.getAllByRole('button', { name: 'Abrir Vistoria agendada' })[0])
    const dialog = within(screen.getByRole('dialog'))
    expect(dialog.getByText('Apartamento vinculado')).toBeVisible()
    expect(dialog.getByText('Responsável: Corretora Ana')).toBeVisible()
    expect(dialog.queryByRole('button', { name: /Editar|Excluir|Salvar/ })).not.toBeInTheDocument()
    expect(dialog.queryByText('Observações')).not.toBeInTheDocument()
    expect(dialog.queryByRole('link')).not.toBeInTheDocument()
    expect(vi.mocked(useCreateAgendaEvent).mock.results[0].value.mutateAsync).not.toHaveBeenCalled()
    expect(vi.mocked(useUpdateAgendaEvent).mock.results[0].value.mutateAsync).not.toHaveBeenCalled()
    expect(useRescheduleAgendaEvent).not.toHaveBeenCalled()
    expect(vi.mocked(useCancelAgendaEvent).mock.results[0].value.mutateAsync).not.toHaveBeenCalled()
  })

  it('explains when a renter has no linked events', () => {
    vi.mocked(useSession).mockReturnValue({
      data: { tenantId: 'renters', role: 'RENTER', user: { id: 'renter-1' } },
      status: 'authenticated',
      update: vi.fn(),
    } as unknown as ReturnType<typeof useSession>)
    renderPage()
    expect(screen.getByText('Nenhum compromisso vinculado a você neste período.')).toBeVisible()
    const calendar = within(screen.getByRole('region', { name: 'Agenda' }))
    expect(calendar.getByText('08:00')).toBeVisible()
    expect(calendar.getByText('18:00')).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Novo Evento' })).not.toBeInTheDocument()
  })

  it('shows charges and both ticket dates even when appointments fail, with links to the records', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: { tenantId: 'tenant-1', role: 'RENTER', user: { id: 'renter-1' } },
      status: 'authenticated',
      update: vi.fn(),
    } as unknown as ReturnType<typeof useSession>)
    mockEventsQuery({ isError: true })
    vi.mocked(useAgendaOrganization).mockReturnValue({
      charges: {
        data: [
          {
            id: 'charge-1',
            code: 'C-1',
            description: 'Rent payment',
            amount: 1500,
            dueDate: `${today}T00:00:00Z`,
            status: 'PENDENTE',
            propertyTitle: 'Apartment',
          },
        ],
        isLoading: false,
        isError: false,
      },
      maintenance: {
        data: [
          {
            id: 'ticket-1',
            title: 'Kitchen leak',
            propertyTitle: 'Apartment',
            status: 'ABERTO',
            createdAt: dayjs(`${today}T09:00:00`).toISOString(),
            scheduledAt: dayjs(`${twoDaysFromNow}T14:00:00`).toISOString(),
          },
        ],
        isLoading: false,
        isError: false,
      },
    } as unknown as ReturnType<typeof useAgendaOrganization>)
    renderPage()
    expect(screen.getByRole('alert')).toBeVisible()
    const calendar = within(screen.getByRole('region', { name: 'Agenda' }))
    expect(calendar.getByRole('link', { name: /Rent payment/ })).toHaveAttribute(
      'href',
      '/dashboard/finance/charges/charge-1',
    )
    const tickets = calendar.getAllByRole('link', { name: /Kitchen leak/ })
    expect(tickets).toHaveLength(2)
    expect(tickets[0]).toHaveTextContent('Abertura do chamado')
    expect(tickets[1]).toHaveTextContent('Atendimento agendado')
    expect(tickets[0]).toHaveAttribute('href', '/dashboard/maintenance/ticket-1')
    expect(tickets[1]).toHaveAttribute('href', '/dashboard/maintenance/ticket-1')
    expect(screen.getByRole('button', { name: 'Semana anterior' })).not.toBeDisabled()
  })

  it.each([false, true])(
    'shows administrator ticket dates even when appointments fail: %s',
    (isError) => {
      vi.mocked(useSession).mockReturnValue({
        data: { tenantId: 'tenant-1', role: 'ADMIN', user: { id: 'admin-1' } },
        status: 'authenticated',
        update: vi.fn(),
      } as unknown as ReturnType<typeof useSession>)
      mockEventsQuery({ data: isError ? [] : [makeEvent()], isError })
      vi.mocked(useAgendaOrganization).mockReturnValue({
        charges: { data: [], isLoading: false, isError: false },
        maintenance: {
          data: [
            {
              id: 'ticket-tenant',
              title: 'Tenant repair',
              propertyTitle: 'Tenant apartment',
              status: 'ABERTO',
              createdAt: dayjs(`${today}T09:00:00`).toISOString(),
              scheduledAt: dayjs(`${twoDaysFromNow}T14:00:00`).toISOString(),
            },
          ],
          isLoading: false,
          isError: false,
        },
      } as unknown as ReturnType<typeof useAgendaOrganization>)
      renderPage()
      const calendar = within(screen.getByRole('region', { name: 'Agenda' }))
      const tickets = calendar.getAllByRole('link', { name: /Tenant repair/ })
      expect(tickets).toHaveLength(2)
      expect(tickets[0]).toHaveTextContent('Abertura do chamado')
      expect(tickets[1]).toHaveTextContent('Atendimento agendado')
      for (const ticket of tickets) {
        expect(ticket).toHaveAttribute('href', '/dashboard/maintenance/ticket-tenant')
      }
      for (const button of screen.getAllByRole('button', { name: 'Novo Evento' })) {
        expect(button).toBeEnabled()
      }
      if (isError) {
        expect(screen.getByRole('alert')).toBeVisible()
      } else {
        expect(calendar.getByText('09:00 - Visita Jardim Paulista')).toBeVisible()
      }
    },
  )

  it('shows a maintenance source failure without hiding administrator appointments', () => {
    vi.mocked(useSession).mockReturnValue({
      data: { tenantId: 'tenant-1', role: 'ADMIN', user: { id: 'admin-1' } },
      status: 'authenticated',
      update: vi.fn(),
    } as unknown as ReturnType<typeof useSession>)
    mockEventsQuery({ data: [makeEvent()] })
    vi.mocked(useAgendaOrganization).mockReturnValue({
      charges: { data: [], isLoading: false, isError: false },
      maintenance: { data: [], isLoading: false, isError: true },
    } as unknown as ReturnType<typeof useAgendaOrganization>)
    renderPage()
    expect(screen.getByRole('alert')).toHaveTextContent(/chamados/i)
    expect(screen.getByText('09:00 - Visita Jardim Paulista')).toBeVisible()
  })

  it('shows loading and errors instead of presenting a failed request as an empty calendar', () => {
    mockEventsQuery({ isLoading: true })
    const { unmount } = renderPage()
    expect(screen.getByRole('progressbar', { name: 'Carregando agenda' })).toBeVisible()
    unmount()
    mockEventsQuery({ isError: true })
    renderPage()
    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível carregar a agenda.')
  })

  it('shows an agenda alert for a visit scheduled today', async () => {
    mockEventsQuery({ data: [makeEvent()] })

    renderPage()

    await userEvent.click(screen.getByRole('button', { name: 'Abrir notificações do dashboard' }))

    const popover = await screen.findByText('Alertas do dashboard')
    const panel = popover.closest('[role="presentation"]') ?? document.body

    expect(within(panel as HTMLElement).getByText('Visita marcada para hoje')).toBeVisible()
  })

  it('does not list cancelled events on the calendar', () => {
    mockEventsQuery({ data: [makeEvent({ status: 'CANCELLED' })] })

    renderPage()

    expect(screen.queryByText('09:00 - Visita Jardim Paulista')).not.toBeInTheDocument()
  })

  it('creates a new event through the form dialog', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(makeEvent())
    mockCreateEvent({ mutateAsync })
    renderPage()

    const [newEventButton] = screen.getAllByRole('button', { name: 'Novo Evento' })
    await userEvent.click(newEventButton)
    await userEvent.type(screen.getByLabelText('Título'), 'Visita apartamento novo')
    await userEvent.click(screen.getByLabelText('Imóvel em questão'))
    await userEvent.click(await screen.findByRole('option', { name: 'Outro' }))
    await userEvent.type(screen.getByLabelText('Imóvel ou referência'), 'Sala comercial centro')
    await userEvent.type(screen.getByLabelText('Cliente'), 'Novo Cliente')
    await userEvent.type(screen.getByLabelText('Telefone'), '11987654321')

    await userEvent.click(screen.getByRole('button', { name: 'Criar evento' }))

    await waitFor(() =>
      expect(mocks.enqueueSnackbar).toHaveBeenCalledWith(
        'Visita apartamento novo adicionado à agenda.',
        { variant: 'success' },
      ),
    )
    expect(mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Visita apartamento novo',
        propertyReference: 'Sala comercial centro',
        participantName: 'Novo Cliente',
        participantPhone: '(11) 98765-4321',
      }),
    )
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('shows an error and keeps the dialog open when creation fails', async () => {
    const mutateAsync = vi.fn().mockRejectedValue(new Error('network down'))
    mockCreateEvent({ mutateAsync })
    renderPage()

    const [newEventButton] = screen.getAllByRole('button', { name: 'Novo Evento' })
    await userEvent.click(newEventButton)
    await userEvent.type(screen.getByLabelText('Título'), 'Visita apartamento novo')
    await userEvent.click(screen.getByLabelText('Imóvel em questão'))
    await userEvent.click(await screen.findByRole('option', { name: 'Outro' }))
    await userEvent.type(screen.getByLabelText('Imóvel ou referência'), 'Sala comercial centro')
    await userEvent.type(screen.getByLabelText('Cliente'), 'Novo Cliente')
    await userEvent.type(screen.getByLabelText('Telefone'), '11987654321')

    await userEvent.click(screen.getByRole('button', { name: 'Criar evento' }))

    await waitFor(() =>
      expect(mocks.enqueueSnackbar).toHaveBeenCalledWith(
        'Não foi possível criar o evento. Tente novamente.',
        { variant: 'error' },
      ),
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('switches the mobile day list when a different day chip is selected', async () => {
    mockEventsQuery({
      data: [
        makeEvent(),
        makeEvent({
          id: 'event-2',
          title: 'Reunião captação',
          start: dayjs(`${twoDaysFromNow}T10:30:00`).toISOString(),
          end: dayjs(`${twoDaysFromNow}T11:30:00`).toISOString(),
        }),
      ],
    })
    const user = userEvent.setup()
    const { container } = renderPage()

    expect(screen.getByText(/Visita Jardim Paulista - /)).toBeVisible()

    const dayButtons = container.querySelectorAll('button[aria-pressed]')
    await user.click(dayButtons[2])

    expect(screen.getByText(/Reunião captação - /)).toBeVisible()
    expect(screen.queryByText(/Visita Jardim Paulista - /)).not.toBeInTheDocument()
  })

  it('edits an existing event through the detail dialog', async () => {
    const rescheduleMutateAsync = vi.fn().mockResolvedValue(makeEvent())
    const updateMutateAsync = vi.fn().mockResolvedValue(makeEvent({ title: 'Visita remarcada' }))
    mockEventsQuery({ data: [makeEvent()] })
    mockRescheduleEvent({ mutateAsync: rescheduleMutateAsync })
    mockUpdateEvent({ mutateAsync: updateMutateAsync })
    renderPage()

    const [openEventButton] = screen.getAllByRole('button', {
      name: 'Abrir Visita Jardim Paulista',
    })
    await userEvent.click(openEventButton)
    await userEvent.click(await screen.findByRole('button', { name: 'Editar' }))

    const titleField = screen.getByLabelText('Título')
    await userEvent.clear(titleField)
    await userEvent.type(titleField, 'Visita remarcada')

    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() =>
      expect(mocks.enqueueSnackbar).toHaveBeenCalledWith(
        'Visita remarcada atualizado com sucesso.',
        { variant: 'success' },
      ),
    )
    expect(rescheduleMutateAsync).not.toHaveBeenCalled()
    expect(updateMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'event-1',
        payload: expect.objectContaining({ title: 'Visita remarcada' }),
      }),
    )
  })

  it('deletes an event after confirming', async () => {
    const cancelMutateAsync = vi.fn().mockResolvedValue(makeEvent({ status: 'CANCELLED' }))
    mockEventsQuery({ data: [makeEvent()] })
    mockCancelEvent({ mutateAsync: cancelMutateAsync })
    renderPage()

    const [openEventButton] = screen.getAllByRole('button', {
      name: 'Abrir Visita Jardim Paulista',
    })
    await userEvent.click(openEventButton)
    await userEvent.click(await screen.findByRole('button', { name: 'Excluir' }))

    const dialogs = await screen.findAllByRole('dialog')
    const confirmDialog = dialogs[dialogs.length - 1]
    await userEvent.click(within(confirmDialog).getByRole('button', { name: 'Excluir' }))

    await waitFor(() =>
      expect(mocks.enqueueSnackbar).toHaveBeenCalledWith(
        'Visita Jardim Paulista excluído da agenda.',
        { variant: 'success' },
      ),
    )
    expect(cancelMutateAsync).toHaveBeenCalledWith('event-1')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })
})
