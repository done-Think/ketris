import type { CrmPropertyDetail, CrmPropertyFilters, CrmPropertyPage } from '../../types/property'

export interface CrmPropertyCatalog {
  list(filters: CrmPropertyFilters): Promise<CrmPropertyPage>
  get(id: string): Promise<CrmPropertyDetail | null>
}
