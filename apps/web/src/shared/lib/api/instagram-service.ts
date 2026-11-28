import { BaseService } from './base-service'
import type {
  InstagramConnectionState,
  InstagramPublicationInput,
  InstagramPublicationState,
} from '@shared/types/instagram'

class InstagramService extends BaseService {
  connection() {
    return this.http.get<InstagramConnectionState>('/instagram/connection')
  }
  connect() {
    return this.http.post<{ authorizationUrl: string }>('/instagram/oauth/start')
  }
  disconnect() {
    return this.http.delete('/instagram/connection')
  }
  publications(propertyId: string) {
    return this.http.get<{ publications: InstagramPublicationState[] }>(
      `/instagram/properties/${encodeURIComponent(propertyId)}/publications`,
    )
  }
  queue(propertyId: string, input: InstagramPublicationInput) {
    return this.http.post<{ publication: InstagramPublicationState }>(
      `/instagram/properties/${encodeURIComponent(propertyId)}/publications`,
      input,
    )
  }
  retry(id: string) {
    return this.http.post(`/instagram/publications/${encodeURIComponent(id)}/retry`)
  }
}
export const instagramService = new InstagramService()
