import { BaseService } from '@shared/lib/api/base-service'
import type {
  OwnPublicProfileAddress,
  PublicProfileAddressAvailability,
  PublicProfileKind,
} from '../types/profile-address'

export class ProfileAddressService extends BaseService {
  getOwn(kind: PublicProfileKind) {
    return this.http.get<OwnPublicProfileAddress>(`/marketplace/profiles/${kind}/address`)
  }
  save(kind: PublicProfileKind, handle: string) {
    return this.http.put<OwnPublicProfileAddress>(`/marketplace/profiles/${kind}/address`, {
      handle,
    })
  }
  availability(kind: PublicProfileKind, handle: string) {
    return this.http.get<PublicProfileAddressAvailability>(
      `/marketplace/profiles/${kind}/address/availability`,
      { params: { handle } },
    )
  }
}
export const profileAddressService = new ProfileAddressService()
