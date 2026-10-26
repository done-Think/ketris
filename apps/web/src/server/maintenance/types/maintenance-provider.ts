import type { MaintenanceActor, MaintenanceProvider } from './maintenance-ticket'

export interface MaintenanceProviderRecord extends MaintenanceProvider {
  id: string
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export interface MaintenanceProviderFilters {
  search?: string
  page?: number
  pageSize?: number
  includeInactive?: boolean
}

export interface MaintenanceProvidersPage {
  items: MaintenanceProviderRecord[]
  totalCount: number
  page: number
  pageSize: number
}

export type MaintenanceProviderChanges = Partial<MaintenanceProvider> & { active?: boolean }
export interface ListMaintenanceProvidersInput
  extends MaintenanceActor, MaintenanceProviderFilters {
  ticketId?: string
}
export interface CreateMaintenanceProviderInput extends MaintenanceActor {
  ticketId?: string
  provider: MaintenanceProvider
}
export interface UpdateMaintenanceProviderInput extends MaintenanceActor {
  providerId: string
  changes: MaintenanceProviderChanges
}
