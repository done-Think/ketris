import type { components } from '@shared/types/generated/api'

export type AgendaEventNotificationSource = Pick<
  components['schemas']['AgendaEvent'],
  | 'id'
  | 'title'
  | 'kind'
  | 'status'
  | 'start'
  | 'propertyReference'
  | 'propertyLabel'
  | 'participantName'
>
