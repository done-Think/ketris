import type {
  CreateMaintenanceProviderRequestDTO,
  MaintenanceProviderDTO,
  MaintenanceProvidersFiltersDTO,
  MaintenanceProvidersResponseDTO,
  UpdateMaintenanceProviderRequestDTO,
} from '@shared/types/generated/maintenance/dto'
import type { z } from 'zod'
import type { createMaintenanceProviderSchema } from '../schemas/maintenance-provider-schema'

export type MaintenanceProviderOption = MaintenanceProviderDTO
export type MaintenanceProvidersResponse = MaintenanceProvidersResponseDTO
export type MaintenanceProviderFilters = Omit<MaintenanceProvidersFiltersDTO, 'includeInactive'> & {
  includeInactive?: boolean
}
export type CreateMaintenanceProviderPayload = CreateMaintenanceProviderRequestDTO
export type UpdateMaintenanceProviderPayload = UpdateMaintenanceProviderRequestDTO
export type MaintenanceProviderFormValues = z.infer<
  ReturnType<typeof createMaintenanceProviderSchema>
>
export interface MaintenanceProvidersDialogProps {
  open: boolean
  onClose: () => void
}
export interface MaintenanceProviderFormProps {
  provider?: MaintenanceProviderOption
  isPending: boolean
  onClose: () => void
  onSubmit: (values: MaintenanceProviderFormValues) => Promise<void>
}
export type MaintenanceProviderEditor =
  { kind: 'create' } | { kind: 'edit'; provider: MaintenanceProviderOption } | null
