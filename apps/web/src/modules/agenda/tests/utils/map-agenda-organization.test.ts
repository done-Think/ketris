import { expect, it } from 'vitest'
import dayjs from 'dayjs'
import { mapAgendaOrganization } from '../../utils/map-agenda-organization'

it('preserves charge due dates and shows a scheduled ticket only on its service date', () => {
  const createdAt = '2026-10-20T15:00:00Z'
  const scheduledAt = '2026-10-22T17:30:00Z'
  const result = mapAgendaOrganization(
    [
      {
        id: 'charge',
        code: 'C-1',
        description: null,
        dueDate: '2026-10-21T00:00:00Z',
        amount: 100,
        status: 'PENDING',
        propertyTitle: null,
      },
    ],
    [
      {
        id: 'ticket',
        title: 'Leak',
        propertyTitle: 'Apartment',
        status: 'OPEN',
        createdAt,
        scheduledAt,
      },
    ],
  )
  expect(result).toHaveLength(2)
  expect(result.find((item) => item.kind === 'charge')).toMatchObject({
    date: '2026-10-21',
    title: 'C-1',
    amount: 100,
  })
  expect(result.find((item) => item.kind === 'ticketOpened')).toBeUndefined()
  expect(result.find((item) => item.kind === 'ticketScheduled')).toMatchObject({
    sourceId: 'ticket',
    date: dayjs(scheduledAt).format('YYYY-MM-DD'),
    time: dayjs(scheduledAt).format('HH:mm'),
  })
})

it('does not invent an appointment for tickets without a scheduled date', () => {
  expect(
    mapAgendaOrganization(
      [],
      [
        {
          id: 'ticket',
          title: 'Leak',
          propertyTitle: 'Apartment',
          status: 'RESOLVED',
          createdAt: '2026-10-20T15:00:00Z',
          scheduledAt: null,
        },
      ],
    ).map((item) => item.kind),
  ).toEqual(['ticketOpened'])
})

it('shows an unscheduled ticket on its opening date so the agency can schedule it', () => {
  const createdAt = '2026-10-20T15:00:00Z'
  const [opened] = mapAgendaOrganization(
    [],
    [
      {
        id: 'ticket',
        title: 'Leak',
        propertyTitle: 'Apartment',
        status: 'OPEN',
        createdAt,
        scheduledAt: null,
      },
    ],
  )
  expect(opened).toMatchObject({
    kind: 'ticketOpened',
    sourceId: 'ticket',
    date: dayjs(createdAt).format('YYYY-MM-DD'),
  })
})
