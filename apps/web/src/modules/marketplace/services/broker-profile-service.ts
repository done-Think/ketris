import { BaseService } from '@shared/lib/api/base-service'

import type {
  BrokerProfileResponse,
  ListBrokerProfilesResponse,
  OwnBrokerProfileResponse,
  PublicBrokerProfile,
  SaveBrokerProfileRequest,
} from '../types/public-broker-profile'

export class BrokerProfileService extends BaseService {
  private readonly publicPath = '/marketplace/brokers'
  private readonly ownPath = '/marketplace/profiles/broker'

  list(): Promise<PublicBrokerProfile[]> {
    return this.http.get<ListBrokerProfilesResponse>(this.publicPath).then((data) => data.brokers)
  }

  getById(id: string): Promise<PublicBrokerProfile> {
    return this.http
      .get<BrokerProfileResponse>(`${this.publicPath}/${id}`)
      .then((data) => data.broker)
  }

  getOwn(): Promise<PublicBrokerProfile | null> {
    return this.http.get<OwnBrokerProfileResponse>(this.ownPath).then((data) => data.profile)
  }

  save(payload: SaveBrokerProfileRequest): Promise<PublicBrokerProfile> {
    return this.http
      .put<OwnBrokerProfileResponse>(this.ownPath, payload)
      .then((data) => data.profile as PublicBrokerProfile)
  }

  publish(): Promise<PublicBrokerProfile> {
    return this.http
      .post<OwnBrokerProfileResponse>(`${this.ownPath}/publish`)
      .then((data) => data.profile as PublicBrokerProfile)
  }

  unpublish(): Promise<PublicBrokerProfile> {
    return this.http
      .post<OwnBrokerProfileResponse>(`${this.ownPath}/unpublish`)
      .then((data) => data.profile as PublicBrokerProfile)
  }
}

export const brokerProfileService = new BrokerProfileService()
