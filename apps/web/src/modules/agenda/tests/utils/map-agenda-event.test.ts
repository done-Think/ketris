import { describe, expect, it } from 'vitest'

import { toAgendaEvent } from '../../utils/map-agenda-event'
import type { AgendaEventApi } from '../../types/agenda-event'

const baseApiEvent: AgendaEventApi = {
  id: 'event-1',
  tenantId: 'tenant-1',
  responsibleId: 'user-1',
  createdById: 'user-1',
  propertyId: null,
  propertyReference: 'Sala comercial centro',
  title: 'Visita apartamento',
  kind: 'VISIT',
  status: 'CONFIRMED',
  start: '2026-10-05T13:00:00.000Z',
  end: '2026-10-05T14:00:00.000Z',
  participantName: 'Ana',
  participantPhone: '(11) 99999-0000',
  notes: 'Cliente confirmou presença.',
  createdAt: '2026-10-01T10:00:00.000Z',
  updatedAt: '2026-10-01T10:00:00.000Z',
}

describe('toAgendaEvent', () => {
  it('maps the API fields to the UI shape, computing duration from start/end', () => {
    const result = toAgendaEvent(baseApiEvent)

    expect(result).toMatchObject({
      id: 'event-1',
      durationMinutes: 60,
      title: 'Visita apartamento',
      property: 'Sala comercial centro',
      participant: 'Ana',
      phone: '(11) 99999-0000',
      notes: 'Cliente confirmou presença.',
      kind: 'visit',
    })
  })

  it.each([
    ['CONFIRMED', 'Confirmada', 'primary'],
    ['PENDING', 'Pendente', 'warning'],
    ['RESCHEDULE', 'Reagendar', 'info'],
    ['CANCELLED', 'Reagendar', 'info'],
  ] as const)('maps API status %s to status %s and tone %s', (apiStatus, status, tone) => {
    const result = toAgendaEvent({ ...baseApiEvent, status: apiStatus })

    expect(result.status).toBe(status)
    expect(result.tone).toBe(tone)
  })

  it('falls back to an empty property label when there is no reference', () => {
    const result = toAgendaEvent({ ...baseApiEvent, propertyReference: null })

    expect(result.property).toBe('')
  })

  it('maps every API kind to its UI equivalent', () => {
    expect(toAgendaEvent({ ...baseApiEvent, kind: 'FOLLOW_UP' }).kind).toBe('followUp')
    expect(toAgendaEvent({ ...baseApiEvent, kind: 'MEETING' }).kind).toBe('meeting')
    expect(toAgendaEvent({ ...baseApiEvent, kind: 'INSPECTION' }).kind).toBe('inspection')
    expect(toAgendaEvent({ ...baseApiEvent, kind: 'SIGNATURE' }).kind).toBe('signature')
  })

  it('leaves kind undefined when the API returns no kind', () => {
    const result = toAgendaEvent({ ...baseApiEvent, kind: null })

    expect(result.kind).toBeUndefined()
  })

  it('resolves the property label and href from propertyId via the lookup map', () => {
    const result = toAgendaEvent(
      { ...baseApiEvent, propertyId: 'prop-1', propertyReference: null },
      { 'prop-1': { id: 'prop-1', href: '/dashboard/properties/prop-1', label: 'Apto Jardins' } },
    )

    expect(result.property).toBe('Apto Jardins')
    expect(result.propertyHref).toBe('/dashboard/properties/prop-1')
    expect(result.propertyId).toBe('prop-1')
  })

  it('prefers the free-text reference over the resolved property label when both are set', () => {
    const result = toAgendaEvent(
      { ...baseApiEvent, propertyId: 'prop-1', propertyReference: 'Sala comercial centro' },
      { 'prop-1': { id: 'prop-1', href: '/dashboard/properties/prop-1', label: 'Apto Jardins' } },
    )

    expect(result.property).toBe('Sala comercial centro')
  })

  it('exposes the raw API kind for editing, even when it collapses to the same display kind as another', () => {
    expect(toAgendaEvent({ ...baseApiEvent, kind: 'OTHER' }).apiKind).toBe('OTHER')
    expect(toAgendaEvent({ ...baseApiEvent, kind: 'VISIT' }).apiKind).toBe('VISIT')
  })
})
