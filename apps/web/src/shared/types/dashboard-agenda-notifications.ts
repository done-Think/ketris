export interface AgendaEventNotificationSource {
  id: string
  title: string
  kind: 'VISIT' | 'FOLLOW_UP' | 'MEETING' | 'INSPECTION' | 'SIGNATURE' | 'OTHER' | null
  status: 'CONFIRMED' | 'PENDING' | 'RESCHEDULE' | 'CANCELLED'
  start: string
  propertyReference: string | null
  participantName: string
}
