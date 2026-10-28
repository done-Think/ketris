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

export type MaintenanceAction = MaintenanceActionDTO
export type MaintenancePermissions = MaintenancePermissionsDTO
export type MaintenanceOptions = MaintenanceOptionsDTO
export type MaintenanceProvider = NonNullable<MaintenanceTicketDTO['provider']>
export type ApiMaintenanceTicketStatus = MaintenanceTicketStatusDTO
export type ApiMaintenanceTicketPriority = MaintenanceTicketPriorityDTO
export type ApiMaintenanceActivityType = MaintenanceActivityTypeDTO
export type ApiMaintenanceActivity = MaintenanceActivityDTO
export type ApiMaintenanceAttachment = MaintenanceAttachmentDTO

type OptionalTicketFields =
  | 'scheduledAt'
  | 'contractId'
  | 'responsibleId'
  | 'responsibleName'
  | 'provider'
  | 'deletedAt'
  | 'permissions'
  | 'replacementRequests'
  | 'completedByRole'
export type ApiMaintenanceTicket = Omit<MaintenanceTicketDTO, OptionalTicketFields> &
  Partial<Pick<MaintenanceTicketDTO, OptionalTicketFields>>

type OptionalListItemFields =
  'scheduledAt' | 'contractId' | 'responsibleId' | 'responsibleName' | 'deletedAt' | 'permissions'
export type ApiMaintenanceTicketListItem = Omit<
  MaintenanceTicketListItemDTO,
  OptionalListItemFields
> &
  Partial<Pick<MaintenanceTicketListItemDTO, OptionalListItemFields>>

export type MaintenanceTicketListFilters = Omit<
  Partial<ListMaintenanceTicketsQueryDTO>,
  'archived'
> & { archived?: boolean }
export type CreateMaintenanceTicketPayload = CreateMaintenanceTicketRequestDTO
export type UpdateMaintenanceTicketPayload = UpdateMaintenanceTicketRequestDTO
export type ListMaintenanceTicketsResponse = Omit<MaintenanceTicketListResponseDTO, 'items'> & {
  items: ApiMaintenanceTicketListItem[]
}
export interface MaintenanceTicketResponse {
  ticket: ApiMaintenanceTicket
}
export interface MaintenanceActivityResponse {
  activity: ApiMaintenanceActivity
}
export interface MaintenanceActivitiesResponse {
  activities: ApiMaintenanceActivity[]
}
export interface UploadMaintenanceTicketAttachmentResponse {
  attachment: ApiMaintenanceAttachment
}
export type MaintenanceUserLinkInput = MaintenanceLinksDTO
export interface UpdateMaintenanceTicketVariables {
  id: string
  payload: UpdateMaintenanceTicketPayload
}
