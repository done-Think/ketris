import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'

import {
  buildFollowUpFormValues,
  canRecordAgendaEventOutcome,
  getAgendaEventDisplayStatus,
  getAgendaEventPresentation,
  isAgendaEventAwaitingOutcome,
  toRecordAgendaEventOutcomePayload,
} from '../../utils/agenda-event-outcome'
import { agendaEventFixture } from '../fixtures/agenda-event'

const startedAt = dayjs('2031-03-01T12:30:00')
const endedAt = dayjs('2031-03-01T13:00:00')
const beforeStart = dayjs('2031-03-01T11:59:00')
const agent = { role: 'AGENT' as const, userId: 'agent-1' }
const owner = { role: 'OWNER' as const, userId: 'owner-1' }

describe('canRecordAgendaEventOutcome', () => {
  it('libera a equipe a partir do início do evento', () => {
    const event = agendaEventFixture()

    expect(canRecordAgendaEventOutcome(agent, event, startedAt)).toBe(true)
    expect(canRecordAgendaEventOutcome(owner, event, startedAt)).toBe(true)
    expect(canRecordAgendaEventOutcome(agent, event, beforeStart)).toBe(false)
  })

  it.each(['RENTER', 'PROPERTY_OWNER'] as const)('não libera %s', (role) => {
    const event = agendaEventFixture({ createdById: 'user-1', responsibleId: 'user-1' })

    expect(canRecordAgendaEventOutcome({ role, userId: 'user-1' }, event, startedAt)).toBe(false)
  })

  it('segue a regra de edição: corretor não registra evento direcionado a outro', () => {
    const event = agendaEventFixture({ audience: 'ASSIGNED_AGENT', responsibleId: 'agent-2' })

    expect(canRecordAgendaEventOutcome(agent, event, startedAt)).toBe(false)
  })

  it('só o gestor corrige um resultado já registrado, e evento cancelado nunca recebe', () => {
    const closed = agendaEventFixture({ status: 'COMPLETED' })

    expect(canRecordAgendaEventOutcome(agent, closed, startedAt)).toBe(false)
    expect(canRecordAgendaEventOutcome(owner, closed, startedAt)).toBe(true)
    expect(
      canRecordAgendaEventOutcome(owner, agendaEventFixture({ status: 'CANCELLED' }), startedAt),
    ).toBe(false)
    expect(canRecordAgendaEventOutcome(owner, null, startedAt)).toBe(false)
  })
})

describe('status exibido', () => {
  it('marca como aguardando resultado só depois do fim e enquanto não houver resultado', () => {
    const event = agendaEventFixture()

    expect(isAgendaEventAwaitingOutcome(event, startedAt)).toBe(false)
    expect(isAgendaEventAwaitingOutcome(event, endedAt)).toBe(true)
    expect(getAgendaEventDisplayStatus(event, endedAt)).toBe('AWAITING_OUTCOME')
    expect(getAgendaEventDisplayStatus(agendaEventFixture({ status: 'NO_SHOW' }), endedAt)).toBe(
      'NO_SHOW',
    )
    expect(isAgendaEventAwaitingOutcome(agendaEventFixture({ status: 'CANCELLED' }), endedAt)).toBe(
      false,
    )
  })
})

describe('toRecordAgendaEventOutcomePayload', () => {
  it('envia interesse só em visita realizada e omite anotações em branco', () => {
    const visit = agendaEventFixture({ apiKind: 'VISIT' })

    expect(
      toRecordAgendaEventOutcomePayload(
        { outcome: 'COMPLETED', visitInterest: 'HIGH', notes: '  Quer proposta.  ' },
        visit,
      ),
    ).toEqual({ outcome: 'COMPLETED', visitInterest: 'HIGH', notes: 'Quer proposta.' })
    expect(
      toRecordAgendaEventOutcomePayload(
        { outcome: 'NO_SHOW', visitInterest: 'HIGH', notes: '   ' },
        visit,
      ),
    ).toEqual({ outcome: 'NO_SHOW' })
    expect(
      toRecordAgendaEventOutcomePayload(
        { outcome: 'COMPLETED', visitInterest: 'LOW', notes: '' },
        agendaEventFixture({ apiKind: 'MEETING' }),
      ),
    ).toEqual({ outcome: 'COMPLETED' })
  })
})

describe('buildFollowUpFormValues', () => {
  it('reaproveita cliente, telefone e imóvel cadastrado como follow-up', () => {
    const event = agendaEventFixture({ propertyId: 'property-1', property: 'Studio' })

    expect(buildFollowUpFormValues(event, 'Retorno: Reunião', false)).toEqual({
      title: 'Retorno: Reunião',
      kind: 'FOLLOW_UP',
      participant: 'Ana',
      phone: '11999999999',
      propertyId: 'property-1',
      customProperty: '',
    })
  })

  it('usa a referência livre quando não há imóvel cadastrado e mantém o destinatário para o gestor', () => {
    const event = agendaEventFixture({
      propertyId: null,
      property: 'Sítio da estrada velha',
      audience: 'ASSIGNED_AGENT',
      responsibleId: 'agent-1',
    })

    expect(buildFollowUpFormValues(event, 'Retorno', true)).toMatchObject({
      propertyId: 'other',
      customProperty: 'Sítio da estrada velha',
      audience: 'ASSIGNED_AGENT',
      internal: false,
      responsibleId: 'agent-1',
    })
  })
})

describe('getAgendaEventPresentation', () => {
  it('troca o tom só quando o status exibido difere do status salvo', () => {
    const event = agendaEventFixture({ tone: 'primary' })

    expect(getAgendaEventPresentation(event, startedAt)).toMatchObject({
      displayStatus: 'CONFIRMED',
      tone: 'primary',
      StatusIcon: undefined,
    })
    expect(getAgendaEventPresentation(event, endedAt)).toMatchObject({
      displayStatus: 'AWAITING_OUTCOME',
      tone: 'warning',
    })
    expect(getAgendaEventPresentation(event, endedAt).StatusIcon).toBeDefined()
  })
})
