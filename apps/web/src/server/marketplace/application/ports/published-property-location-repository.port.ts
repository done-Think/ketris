import type { AddressCoordinates } from '@server/shared/location/address-geocoder.port'
import type { PropertyAddress } from '../../types/property'

export interface PropertyLocationCandidate {
  propertyId: string
  address: PropertyAddress
  updatedAt: Date
}

export interface PublishedPropertyLocationRepository {
  findCandidates(propertyIds: string[], limit: number): Promise<PropertyLocationCandidate[]>
  saveResult(
    candidate: PropertyLocationCandidate,
    coordinates: AddressCoordinates | null,
  ): Promise<boolean>
}
