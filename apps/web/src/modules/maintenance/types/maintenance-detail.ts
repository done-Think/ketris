import type { ApiMaintenanceTicket } from './service'

export interface MaintenanceTicketSectionProps {
  ticket: ApiMaintenanceTicket
}

export type MaintenanceNoteFormValues = import('zod').z.infer<
  ReturnType<typeof import('../schemas/maintenance-note-schema').createMaintenanceNoteSchema>
>
