import type { AgendaEvent } from '../../types/agenda-event'

export function agendaEventFixture(overrides: Partial<AgendaEvent> = {}): AgendaEvent {
  return {
    id: 'event-1',
    scheduledDate: '2031-03-01',
    time: '12:00',
    durationMinutes: 60,
    title: 'Reunião',
    property: 'Apartamento',
    propertyHref: '/dashboard/properties',
    propertyId: null,
    apiKind: 'MEETING',
    participant: 'Ana',
    phone: '11999999999',
    notes: '',
    status: 'CONFIRMED',
    tone: 'primary',
    audience: 'SHARED_TEAM',
    responsibleId: 'other-user',
    createdById: 'other-user',
    ...overrides,
  }
}
