import { BaseService } from '@shared/lib/api/base-service'

export interface AgencySearchResult {
  id: string
  name: string
}

interface SearchAgenciesResponse {
  tenants: AgencySearchResult[]
}

class RegistrationService extends BaseService {
  searchAgencies(query: string): Promise<AgencySearchResult[]> {
    return this.http
      .get<SearchAgenciesResponse>('/tenants/search', { params: { q: query } })
      .then((data) => data.tenants)
  }
}

export const registrationService = new RegistrationService()
