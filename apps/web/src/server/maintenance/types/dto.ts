import type { z } from 'zod'
import type {
  createMaintenanceTicketRequestSchema,
  updateMaintenanceTicketRequestSchema,
  addMaintenanceTicketNoteRequestSchema,
  listMaintenanceTicketsQuerySchema,
} from '../schemas/maintenance-ticket-input.schema'

export type CreateMaintenanceTicketRequestDTO = z.infer<typeof createMaintenanceTicketRequestSchema>
export type UpdateMaintenanceTicketRequestDTO = z.infer<typeof updateMaintenanceTicketRequestSchema>
export type AddMaintenanceTicketNoteRequestDTO = z.infer<
  typeof addMaintenanceTicketNoteRequestSchema
>
export type ListMaintenanceTicketsQueryDTO = z.infer<typeof listMaintenanceTicketsQuerySchema>
