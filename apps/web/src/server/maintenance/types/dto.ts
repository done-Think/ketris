import type { z } from 'zod'
import type {
  addMaintenanceTicketNoteRequestSchema,
  createMaintenanceTicketRequestSchema,
  listMaintenanceTicketsQuerySchema,
  updateMaintenanceTicketRequestSchema,
} from '../schemas/maintenance-ticket-input.schema'

export type CreateMaintenanceTicketRequestDTO = z.input<typeof createMaintenanceTicketRequestSchema>
export type UpdateMaintenanceTicketRequestDTO = z.input<typeof updateMaintenanceTicketRequestSchema>
export type AddMaintenanceTicketNoteRequestDTO = z.infer<
  typeof addMaintenanceTicketNoteRequestSchema
>
export type ListMaintenanceTicketsQueryDTO = z.infer<typeof listMaintenanceTicketsQuerySchema>

export type MaintenanceTicketDTO = z.infer<
  typeof import('../schemas/maintenance-ticket.schema').maintenanceTicketSchema
>
export type MaintenanceTicketListItemDTO = z.infer<
  typeof import('../schemas/maintenance-ticket.schema').maintenanceTicketListItemSchema
>
export type MaintenanceActivityDTO = z.infer<
  typeof import('../schemas/maintenance-ticket.schema').maintenanceActivitySchema
>
export type MaintenanceAttachmentDTO = z.infer<
  typeof import('../schemas/maintenance-ticket.schema').maintenanceAttachmentSchema
>
export type MaintenanceOptionsDTO = z.infer<
  typeof import('../schemas/maintenance-ticket.schema').maintenanceOptionsSchema
>
export type MaintenancePermissionsDTO = z.infer<
  typeof import('../schemas/maintenance-ticket.schema').maintenancePermissionsSchema
>
export type MaintenanceActionDTO = z.input<
  typeof import('../schemas/maintenance-ticket-input.schema').maintenanceActionSchema
>
export type MaintenanceTicketStatusDTO = z.infer<
  typeof import('../schemas/maintenance-ticket.schema').maintenanceTicketStatusSchema
>
export type MaintenanceTicketPriorityDTO = z.infer<
  typeof import('../schemas/maintenance-ticket.schema').maintenanceTicketPrioritySchema
>
export type MaintenanceActivityTypeDTO = z.infer<
  typeof import('../schemas/maintenance-ticket.schema').maintenanceActivityTypeSchema
>
export type MaintenanceLinksDTO = z.input<
  typeof import('../schemas/maintenance-ticket-input.schema').maintenanceLinksSchema
>
export type MaintenanceTicketListResponseDTO = z.infer<
  typeof import('../schemas/maintenance-ticket.schema').maintenanceTicketsResponseSchema
>
export type MaintenanceProviderDTO = z.infer<
  typeof import('../schemas/maintenance-provider.schema').maintenanceProviderRecordSchema
>
export type MaintenanceProvidersResponseDTO = z.infer<
  typeof import('../schemas/maintenance-provider.schema').maintenanceProvidersResponseSchema
>
export type CreateMaintenanceProviderRequestDTO = z.input<
  typeof import('../schemas/maintenance-provider.schema').createMaintenanceProviderRequestSchema
>
export type UpdateMaintenanceProviderRequestDTO = z.input<
  typeof import('../schemas/maintenance-provider.schema').updateMaintenanceProviderRequestSchema
>
export type MaintenanceProvidersFiltersDTO = Partial<
  z.output<
    typeof import('../schemas/maintenance-provider.schema').listMaintenanceProvidersQuerySchema
  >
>

export type MaintenancePrepareUploadResponseDTO = z.infer<
  typeof import('../schemas/maintenance-upload.schema').maintenancePrepareUploadResponseSchema
>
