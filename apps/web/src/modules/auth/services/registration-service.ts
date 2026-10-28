import type {
  RegisterRequestDTO,
  RegisterResponseDTO,
} from '@shared/types/generated/registration/http'

import { BaseService } from '@shared/lib/api/base-service'

import type { AgencySearchResult, SearchAgenciesResponse } from '../types/registration'

class RegistrationService extends BaseService {
  register(input: RegisterRequestDTO): Promise<RegisterResponseDTO> {
    return this.http.post<RegisterResponseDTO>('/register', input, {
      skipUnauthorizedHandling: true,
    })
  }

  searchAgencies(query: string): Promise<AgencySearchResult[]> {
    return this.http
      .get<SearchAgenciesResponse>('/tenants/search', { params: { q: query } })
      .then((data) => data.tenants)
  }
}

export const registrationService = new RegistrationService()
