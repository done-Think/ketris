import { captureException } from '@sentry/nextjs'
import {
  unavailableAddressGeocoder,
  type AddressGeocoder,
} from '@server/shared/location/address-geocoder.port'
import type { PublishedPropertyLocationRepository } from '../ports/published-property-location-repository.port'

export class ResolvePublishedPropertyLocationsUseCase {
  constructor(
    private readonly repository: PublishedPropertyLocationRepository,
    private readonly geocoder: AddressGeocoder,
  ) {}

  async execute(propertyIds: string[]): Promise<{ changed: boolean; pending: boolean }> {
    if (!propertyIds.length || this.geocoder === unavailableAddressGeocoder)
      return { changed: false, pending: false }

    // Only addresses in the user's current results, at most two per response. Never scan the catalog.
    const candidates = await this.repository.findCandidates(propertyIds, 3)
    for (const candidate of candidates.slice(0, 2)) {
      let coordinates = null
      try {
        coordinates = await this.geocoder.locate(candidate.address)
      } catch (error) {
        captureException(error)
      }
      await this.repository.saveResult(candidate, coordinates)
    }
    // Re-read even after a compare-and-set conflict: another request may have changed the address.
    return { changed: candidates.length > 0, pending: candidates.length > 2 }
  }
}
