import dayjs from 'dayjs'

import type {
  AgendaChargeApi,
  AgendaMaintenanceApi,
  AgendaOrganizationItem,
} from '../types/agenda-organization'

export function mapAgendaOrganization(
  charges: AgendaChargeApi[],
  tickets: AgendaMaintenanceApi[],
): AgendaOrganizationItem[] {
  return [
    ...charges.map((charge): AgendaOrganizationItem => ({
      id: `charge-${charge.id}`,
      sourceId: charge.id,
      kind: 'charge',
      date: charge.dueDate.slice(0, 10),
      title: charge.description || charge.code,
      property: charge.propertyTitle ?? '',
      status: charge.status,
      amount: charge.amount,
    })),
    ...tickets.flatMap((ticket): AgendaOrganizationItem[] => {
      const common = {
        sourceId: ticket.id,
        title: ticket.title,
        property: ticket.propertyTitle,
        status: ticket.status,
      }
      return [
        {
          ...common,
          id: `opened-${ticket.id}`,
          kind: 'ticketOpened',
          date: dayjs(ticket.createdAt).format('YYYY-MM-DD'),
          time: dayjs(ticket.createdAt).format('HH:mm'),
        },
        ...(ticket.scheduledAt
          ? [
              {
                ...common,
                id: `scheduled-${ticket.id}`,
                kind: 'ticketScheduled' as const,
                date: dayjs(ticket.scheduledAt).format('YYYY-MM-DD'),
                time: dayjs(ticket.scheduledAt).format('HH:mm'),
              },
            ]
          : []),
      ]
    }),
  ].sort((a, b) => `${a.date}${a.time ?? ''}`.localeCompare(`${b.date}${b.time ?? ''}`))
}
