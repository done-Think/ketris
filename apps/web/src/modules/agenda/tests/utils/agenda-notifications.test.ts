import dayjs from 'dayjs'
import { expect, it, vi } from 'vitest'
import { getAgendaNotifications } from '../../utils/agenda-calendar'
import { agendaEventFixture } from '../fixtures/agenda-event'

const today = dayjs('2031-03-01')
it('reconhece uma visita pelo tipo e não pelo idioma do título', () => {
  const t = vi.fn((key: string) => key)
  const visit = agendaEventFixture({ id: 'visit', title: 'Property tour', apiKind: 'VISIT' })
  const meeting = agendaEventFixture({
    id: 'meeting',
    title: 'Conversa sobre visita',
    apiKind: 'MEETING',
  })
  const notifications = getAgendaNotifications({
    events: [visit, meeting],
    t,
    today,
    currentUserId: 'user',
  })
  expect(notifications.map((item) => item.id)).toEqual(['visit-today-visit'])
})
it('notifica atribuição apenas ao responsável quando outra pessoa criou o evento', () => {
  const t = vi.fn((key: string) => (key === 'creatorRoles.AGENT' ? 'corretor' : key))
  const assigned = agendaEventFixture({
    id: 'assigned',
    createdBy: 'Ana',
    createdByRole: 'AGENT',
    createdById: 'other-user',
    responsibleId: 'user',
  })
  const own = { ...assigned, id: 'own', createdById: 'user' }
  const other = { ...assigned, id: 'other', responsibleId: 'other-user' }
  expect(
    getAgendaNotifications({ events: [assigned, own, other], t, today, currentUserId: 'user' }).map(
      (item) => item.id,
    ),
  ).toEqual(['assigned-assigned'])
  expect(t).toHaveBeenCalledWith(
    'assignedEventMessage',
    expect.objectContaining({ role: 'corretor', name: 'Ana' }),
  )
})
