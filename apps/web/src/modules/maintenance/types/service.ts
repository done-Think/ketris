import type {
  CreateMaintenanceTicketRequestDTO,
  ListMaintenanceTicketsQueryDTO,
  MaintenanceActionDTO,
  MaintenanceActivityDTO,
  MaintenanceActivityTypeDTO,
  MaintenanceAttachmentDTO,
  MaintenanceLinksDTO,
  MaintenanceOptionsDTO,
  MaintenancePermissionsDTO,
  MaintenanceTicketDTO,
  MaintenanceTicketListItemDTO,
  MaintenanceTicketListResponseDTO,
  MaintenanceTicketPriorityDTO,
  MaintenanceTicketStatusDTO,
  UpdateMaintenanceTicketRequestDTO,
} from '@shared/types/generated/maintenance/dto'
import type { components } from '@shared/types/generated/api'

export type MaintenanceAction = MaintenanceActionDTO
export type MaintenancePermissions = MaintenancePermissionsDTO
export type MaintenanceOptions = MaintenanceOptionsDTO
export type MaintenanceProvider = NonNullable<MaintenanceTicketDTO['provider']>
export type ApiMaintenanceTicketStatus = MaintenanceTicketStatusDTO
export type ApiMaintenanceTicketPriority = MaintenanceTicketPriorityDTO
export type ApiMaintenanceActivityType = MaintenanceActivityTypeDTO
export type ApiMaintenanceActivity = MaintenanceActivityDTO
export type ApiMaintenanceAttachment = MaintenanceAttachmentDTO

export type ApiMaintenanceTicket = MaintenanceTicketDTO
export type ApiMaintenanceTicketListItem = MaintenanceTicketListItemDTO

export type MaintenanceTicketListFilters = Omit<
  Partial<ListMaintenanceTicketsQueryDTO>,
  'archived'
> & { archived?: boolean }
export type CreateMaintenanceTicketPayload = CreateMaintenanceTicketRequestDTO
export type UpdateMaintenanceTicketPayload = UpdateMaintenanceTicketRequestDTO
export type ListMaintenanceTicketsResponse = MaintenanceTicketListResponseDTO
export type MaintenanceTicketResponse = components['schemas']['MaintenanceTicketResponse']
export type MaintenanceActivityResponse = components['schemas']['MaintenanceActivityResponse']
export type MaintenanceActivitiesResponse = components['schemas']['MaintenanceActivitiesResponse']
export type UploadMaintenanceTicketAttachmentResponse =
  components['schemas']['MaintenanceAttachmentResponse']
export type MaintenanceUserLinkInput = MaintenanceLinksDTO
export interface UpdateMaintenanceTicketVariables {
  id: string
  payload: UpdateMaintenanceTicketPayload
}
