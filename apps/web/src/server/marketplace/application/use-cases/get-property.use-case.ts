import { PropertyNotFoundError } from '../../domain/errors'
import type { ResolvePublishedPropertyLocationsUseCase } from './resolve-published-property-locations.use-case'
import { toPublicPropertyDetail } from '../../domain/property.entity'
import type { PublicPropertyRepository } from '../ports/public-property-repository.port'
import type { GetPropertyInput, GetPropertyOutput } from '../../types/use-case-inputs'
import {
  unavailableAddressGeocoder,
  type AddressGeocoder,
} from '@server/shared/location/address-geocoder.port'
import {
  hasAddressCoordinates,
  resolveAddressCoordinates,
} from '@server/shared/location/resolve-address-coordinates'

export class GetPropertyUseCase {
  constructor(
    private readonly propertyRepository: PublicPropertyRepository,
    private readonly geocoder: AddressGeocoder = unavailableAddressGeocoder,
    private readonly locations?: ResolvePublishedPropertyLocationsUseCase,
  ) {}

  async execute(input: GetPropertyInput): Promise<GetPropertyOutput> {
    const property = await this.propertyRepository.findPublishedById(input.propertyId)

    if (!property) {
      throw new PropertyNotFoundError()
    }

    if (hasAddressCoordinates(property)) return toPublicPropertyDetail(property)

    if (this.locations) {
      await this.locations.execute([property.id])
      const current = await this.propertyRepository.findPublishedById(property.id)
      if (!current) throw new PropertyNotFoundError()
      return toPublicPropertyDetail(current)
    }

    const address = await resolveAddressCoordinates(property.address ?? undefined, this.geocoder)
    return toPublicPropertyDetail({
      ...property,
      address: address ?? null,
      latitude: address?.latitude ?? null,
      longitude: address?.longitude ?? null,
    })
  }
}
