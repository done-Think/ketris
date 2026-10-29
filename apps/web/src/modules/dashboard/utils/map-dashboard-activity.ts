import dayjs from 'dayjs'

import type {
  DashboardActivityAccent,
  DashboardUpcomingActivity,
} from '../types/dashboard-overview'
import type { ApiDashboardActivityKind, ApiDashboardUpcomingActivity } from '../types/service'

const accentByKind: Record<ApiDashboardActivityKind, DashboardActivityAccent> = {
  VISIT: 'magenta',
  MEETING: 'info',
  FOLLOW_UP: 'warning',
  INSPECTION: 'magenta',
  SIGNATURE: 'magenta',
  OTHER: 'info',
}

export function toDashboardUpcomingActivity(
  event: ApiDashboardUpcomingActivity,
): DashboardUpcomingActivity {
  const start = dayjs(event.start)

  return {
    id: event.id,
    time: start.format('HH:mm'),
    title: event.title,
    contact: event.participantName,
    phone: event.participantPhone,
    accent: event.kind ? accentByKind[event.kind] : 'info',
    meetingTime: start.format('HH:mm'),
    notes: event.notes ?? '',
    propertyId: event.propertyId,
    propertyReference: event.propertyReference,
    property: event.property
      ? {
          title: event.property.title,
          price: event.property.price,
          address: event.property.address
            ? `${event.property.address.street}, ${event.property.address.number} - ${event.property.address.neighborhood}, ${event.property.address.city}`
            : null,
        }
      : null,
  }
}
