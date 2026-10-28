import { PropertyNotFoundError } from '../../domain/errors'
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
  ) {}

  async execute(input: GetPropertyInput): Promise<GetPropertyOutput> {
    const property = await this.propertyRepository.findPublishedById(input.propertyId)

    if (!property) {
      throw new PropertyNotFoundError()
    }

    if (hasAddressCoordinates(property)) return toPublicPropertyDetail(property)

    const address = await resolveAddressCoordinates(property.address ?? undefined, this.geocoder)
    return toPublicPropertyDetail({
      ...property,
      address: address ?? null,
      latitude: address?.latitude ?? null,
      longitude: address?.longitude ?? null,
    })
  }
}
