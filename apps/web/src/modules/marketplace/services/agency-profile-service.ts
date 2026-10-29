import { BaseService } from '@shared/lib/api/base-service'

import type { DirectoryPage, DirectoryQuery } from '../types/directory'

import type {
  AgencyProfileResponse,
  ListAgencyProfilesResponse,
  OwnAgencyProfileResponse,
  PublicAgencyProfile,
  SaveAgencyProfileRequest,
} from '../types/public-agency-profile'

export class AgencyProfileService extends BaseService {
  private readonly publicPath = '/marketplace/agencies'
  private readonly ownPath = '/marketplace/profiles/agency'

  list(query: DirectoryQuery): Promise<DirectoryPage<PublicAgencyProfile>> {
    return this.http
      .get<ListAgencyProfilesResponse>(this.publicPath, {
        params: { ...(query.q ? { q: query.q } : {}), page: query.page, pageSize: query.pageSize },
      })
      .then(({ agencies, ...page }) => ({ items: agencies, ...page }))
  }

  getById(id: string): Promise<PublicAgencyProfile> {
    return this.http
      .get<AgencyProfileResponse>(`${this.publicPath}/${id}`)
      .then((data) => data.agency)
  }

  getOwn(): Promise<PublicAgencyProfile | null> {
    return this.http.get<OwnAgencyProfileResponse>(this.ownPath).then((data) => data.profile)
  }

  save(payload: SaveAgencyProfileRequest): Promise<PublicAgencyProfile> {
    return this.http
      .put<OwnAgencyProfileResponse>(this.ownPath, payload)
      .then((data) => data.profile as PublicAgencyProfile)
  }

  publish(): Promise<PublicAgencyProfile> {
    return this.http
      .post<OwnAgencyProfileResponse>(`${this.ownPath}/publish`)
      .then((data) => data.profile as PublicAgencyProfile)
  }

  unpublish(): Promise<PublicAgencyProfile> {
    return this.http
      .post<OwnAgencyProfileResponse>(`${this.ownPath}/unpublish`)
      .then((data) => data.profile as PublicAgencyProfile)
  }
}

export const agencyProfileService = new AgencyProfileService()
