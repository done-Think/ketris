export interface AgendaEventNotificationSource {
  id: string
  title: string
  status: 'CONFIRMED' | 'PENDING' | 'RESCHEDULE' | 'CANCELLED'
  start: string
  propertyReference: string | null
  participantName: string
}
