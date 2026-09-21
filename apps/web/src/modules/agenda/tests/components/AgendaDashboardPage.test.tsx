import { ThemeProvider } from '@mui/material'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import dayjs from 'dayjs'
import { useSession } from 'next-auth/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'

import { useProperties } from '@modules/properties/hooks/use-properties'

import { AgendaDashboardPage } from '../../components/AgendaDashboardPage'
import {
  useAgendaEvents,
  useCancelAgendaEvent,
  useCreateAgendaEvent,
  useRescheduleAgendaEvent,
  useUpdateAgendaEvent,
} from '../../hooks/use-agenda-events'
import type { AgendaEventApi } from '../../types/agenda-event'

const mocks = vi.hoisted(() => ({
  enqueueSnackbar: vi.fn(),
}))

vi.mock('notistack', () => ({
  useSnackbar: () => ({ enqueueSnackbar: mocks.enqueueSnackbar }),
}))

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}))

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

const today = dayjs().format('YYYY-MM-DD')
const twoDaysFromNow = dayjs().add(2, 'day').format('YYYY-MM-DD')

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
  beforeEach(() => {
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
  })

  it('renders the header and today events on the calendar', () => {
    mockEventsQuery({ data: [makeEvent()] })

    renderPage()

    expect(screen.getByRole('heading', { name: 'Agenda' })).toBeVisible()
    expect(screen.getByText('09:00 - Visita Jardim Paulista')).toBeVisible()
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
    expect(rescheduleMutateAsync).toHaveBeenCalledWith(expect.objectContaining({ id: 'event-1' }))
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
