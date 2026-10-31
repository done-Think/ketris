import type { PublicProfileAddress, PublicProfileTarget } from '../../types/profile-address'

export interface ProfileAddressRepository {
  findByHandle(handle: string): Promise<PublicProfileAddress | null>
  findByProfile(target: PublicProfileTarget): Promise<PublicProfileAddress | null>
  save(target: PublicProfileTarget, handle: string, actorId: string): Promise<PublicProfileAddress>
}
