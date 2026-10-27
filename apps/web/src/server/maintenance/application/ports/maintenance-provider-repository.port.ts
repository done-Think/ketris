import type {
  MaintenanceProviderChanges,
  MaintenanceProviderFilters,
  MaintenanceProviderRecord,
  MaintenanceProvidersPage,
} from '../../types/maintenance-provider'
import type { MaintenanceActor, MaintenanceProvider } from '../../types/maintenance-ticket'

export interface MaintenanceProviderRepository {
  list(tenantId: string, filters: MaintenanceProviderFilters): Promise<MaintenanceProvidersPage>
  create(
    actor: MaintenanceActor,
    tenantId: string,
    provider: MaintenanceProvider,
  ): Promise<MaintenanceProviderRecord>
  update(
    actor: MaintenanceActor,
    providerId: string,
    changes: MaintenanceProviderChanges,
  ): Promise<MaintenanceProviderRecord>
}
