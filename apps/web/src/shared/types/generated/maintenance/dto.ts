import type { components } from '../api'

export type CreateMaintenanceTicketRequestDTO =
  components['schemas']['CreateMaintenanceTicketRequest']
export type UpdateMaintenanceTicketRequestDTO =
  components['schemas']['UpdateMaintenanceTicketRequest']
export type AddMaintenanceTicketNoteRequestDTO =
  components['schemas']['AddMaintenanceTicketNoteRequest']
export type ListMaintenanceTicketsQueryDTO = components['schemas']['ListMaintenanceTicketsQuery']
export type MaintenanceTicketDTO = components['schemas']['MaintenanceTicket']
export type MaintenanceTicketListItemDTO = components['schemas']['MaintenanceTicketListItem']
export type MaintenanceActivityDTO = components['schemas']['MaintenanceActivity']
export type MaintenanceAttachmentDTO = components['schemas']['MaintenanceAttachment']
export type MaintenanceOptionsDTO = components['schemas']['MaintenanceOptions']
export type MaintenancePermissionsDTO = components['schemas']['MaintenancePermissions']
export type MaintenanceActionDTO = components['schemas']['MaintenanceAction']
export type MaintenanceTicketStatusDTO = components['schemas']['MaintenanceTicketStatus']
export type MaintenanceTicketPriorityDTO = components['schemas']['MaintenanceTicketPriority']
export type MaintenanceActivityTypeDTO = components['schemas']['MaintenanceActivityType']
export type MaintenanceLinksDTO = components['schemas']['MaintenanceLinks']
export type MaintenanceTicketListResponseDTO = components['schemas']['MaintenanceTicketsResponse']
export type MaintenanceProviderDTO = components['schemas']['MaintenanceProviderRecord']
export type MaintenanceProvidersResponseDTO = components['schemas']['MaintenanceProvidersResponse']
export type CreateMaintenanceProviderRequestDTO =
  components['schemas']['CreateMaintenanceProviderRequest']
export type UpdateMaintenanceProviderRequestDTO =
  components['schemas']['UpdateMaintenanceProviderRequest']
export type MaintenanceProvidersFiltersDTO = Partial<
  components['schemas']['ListMaintenanceProvidersQuery']
>
export type MaintenancePrepareUploadResponseDTO =
  components['schemas']['MaintenancePrepareUploadResponse']
