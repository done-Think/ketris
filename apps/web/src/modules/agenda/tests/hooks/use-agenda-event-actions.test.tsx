import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAgendaEventActions } from '../../hooks/use-agenda-event-actions'
import { useRecordAgendaEventOutcome } from '../../hooks/use-agenda-events'
import type { AgendaEventApi } from '../../types/agenda-event'
import { agendaEventFixture } from '../fixtures/agenda-event'

const mocks = vi.hoisted(() => ({ enqueueSnackbar: vi.fn() }))

vi.mock('notistack', () => ({ useSnackbar: () => ({ enqueueSnackbar: mocks.enqueueSnackbar }) }))
vi.mock('../../hooks/use-agenda-events', () => ({
  useCreateAgendaEvent: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateAgendaEvent: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCancelAgendaEvent: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useRecordAgendaEventOutcome: vi.fn(),
}))

const selectedEvent = agendaEventFixture({
  id: 'event-1',
  title: 'Visita da Sabrina',
  apiKind: 'VISIT',
  scheduledDate: '2031-03-01',
})

const recordedEvent = {
  id: 'event-1',
  title: 'Visita da Sabrina',
  kind: 'VISIT',
  status: 'COMPLETED',
  start: '2031-03-01T15:00:00.000Z',
  end: '2031-03-01T16:00:00.000Z',
  propertyId: null,
  propertyLabel: null,
  propertyReference: 'Studio',
  participantName: 'Sabrina',
  participantPhone: '(12) 31412-3455',
  notes: null,
  visitInterest: 'MEDIUM',
  outcomeNotes: null,
  outcomeRecordedAt: '2031-03-01T16:10:00.000Z',
  outcomeRecordedById: 'agent-1',
  outcomeRecordedBy: { name: 'Camila' },
} as unknown as AgendaEventApi

function renderActions(mutateAsync: ReturnType<typeof vi.fn>, selectedEventReadOnly = false) {
  vi.mocked(useRecordAgendaEventOutcome).mockReturnValue({
    mutateAsync,
    isPending: false,
  } as unknown as ReturnType<typeof useRecordAgendaEventOutcome>)
  const onUpdated = vi.fn()
  const { result } = renderHook(() =>
    useAgendaEventActions({
      tenantId: 'tenant-1',
      selectedEvent,
      readOnly: false,
      selectedEventReadOnly,
      propertiesById: {},
      onCreated: vi.fn(),
      onUpdated,
    }),
  )
  return { result, onUpdated }
}

describe('useAgendaEventActions — resultado', () => {
  beforeEach(() => vi.clearAllMocks())

  it('envia o payload enxuto, atualiza o evento aberto e confirma o registro', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(recordedEvent)
    const { result, onUpdated } = renderActions(mutateAsync)

    let success = false
    await act(async () => {
      success = await result.current.recordSelectedEventOutcome({
        outcome: 'COMPLETED',
        visitInterest: 'MEDIUM',
        notes: '  ',
      })
    })

    expect(success).toBe(true)
    expect(mutateAsync).toHaveBeenCalledWith({
      id: 'event-1',
      payload: { outcome: 'COMPLETED', visitInterest: 'MEDIUM' },
    })
    expect(onUpdated).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'event-1', status: 'COMPLETED', outcomeRecordedBy: 'Camila' }),
      '2031-03-01',
    )
    expect(mocks.enqueueSnackbar).toHaveBeenCalledWith(
      'Resultado de Visita da Sabrina registrado.',
      { variant: 'success' },
    )
  })

  it('mostra a mensagem do código de erro do servidor e devolve falha', async () => {
    const mutateAsync = vi.fn().mockRejectedValue({
      isAxiosError: true,
      response: { status: 409, data: { error: { code: 'AGENDA_EVENT_CLOSED' } } },
    })
    const { result, onUpdated } = renderActions(mutateAsync)

    let success = true
    await act(async () => {
      success = await result.current.recordSelectedEventOutcome({
        outcome: 'NO_SHOW',
        visitInterest: null,
        notes: '',
      })
    })

    expect(success).toBe(false)
    expect(onUpdated).not.toHaveBeenCalled()
    expect(mocks.enqueueSnackbar).toHaveBeenCalledWith(
      'O resultado deste evento já foi registrado. Atualize a agenda.',
      { variant: 'error' },
    )
  })

  it('não chama o servidor quando o evento aberto é só leitura', async () => {
    const mutateAsync = vi.fn()
    const { result } = renderActions(mutateAsync, true)

    let success = true
    await act(async () => {
      success = await result.current.recordSelectedEventOutcome({
        outcome: 'NO_SHOW',
        visitInterest: null,
        notes: '',
      })
    })

    expect(success).toBe(false)
    expect(mutateAsync).not.toHaveBeenCalled()
  })
})
