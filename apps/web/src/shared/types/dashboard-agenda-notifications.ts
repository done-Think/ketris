import type { AgendaEventResponseDTO } from '@server/agenda/types/http'

export type AgendaEventNotificationSource = Pick<
  AgendaEventResponseDTO,
  | 'id'
  | 'title'
  | 'kind'
  | 'status'
  | 'start'
  | 'propertyReference'
  | 'propertyLabel'
  | 'participantName'
>
