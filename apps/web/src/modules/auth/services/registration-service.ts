import { BaseService } from '@shared/lib/api/base-service'

import type { AgencySearchResult } from '../types/registration'

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
