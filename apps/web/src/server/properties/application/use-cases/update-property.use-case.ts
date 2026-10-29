import { assertPropertyMediaScope } from '../../domain/property-media-policy'
import { isPropertyOwner } from '@server/auth/domain/roles'
import type { PropertyOwnerDirectory } from '../ports/property-owner-directory.port'
import { PropertyOwnerValidationError } from '../../domain/errors'
import type { UpdatePropertyInput } from '../../types/use-case-inputs'

import { assertCanEditProperties, assertPropertyAccess } from '../authorization'
import { PropertyNotFoundError } from '../../domain/errors'
import type { PropertyRepository } from '../ports/property-repository.port'
import {
  unavailableAddressGeocoder,
  type AddressGeocoder,
} from '@server/shared/location/address-geocoder.port'
import { resolveAddressCoordinates } from '@server/shared/location/resolve-address-coordinates'

export class UpdatePropertyUseCase {
  constructor(
    private readonly propertyRepository: PropertyRepository,
    private readonly ownerDirectory: PropertyOwnerDirectory,
    private readonly geocoder: AddressGeocoder = unavailableAddressGeocoder,
  ) {}

  async execute(input: UpdatePropertyInput) {
    assertCanEditProperties(input.actorRole)

    const existing = await this.propertyRepository.findByTenantAndId(input.actorTenantId, input.id)

    if (!existing) {
      throw new PropertyNotFoundError()
    }

    assertPropertyAccess(existing, input.actorId, input.actorRole)

    assertPropertyMediaScope(
      input.actorTenantId,
      input.media,
      existing.media.map((media) => media.url),
    )
    const ownerId = isPropertyOwner(input.actorRole) ? input.actorId : input.ownerId
    if (
      ownerId &&
      ownerId !== existing.ownerId &&
      !(await this.ownerDirectory.findActiveOwner(input.actorTenantId, ownerId))
    ) {
      throw new PropertyOwnerValidationError()
    }

    const property = await this.propertyRepository.update(
      input.actorTenantId,
      input.id,
      {
        ownerId: ownerId,
        title: input.title,
        description: input.description,
        purpose: input.purpose,
        type: input.type,
        listing: input.listing,
        bedrooms: input.bedrooms,
        bathrooms: input.bathrooms,
        parkingSpots: input.parkingSpots,
        areaSqm: input.areaSqm,
        price: input.price,
        rentalPrice: input.rentalPrice,
        condoFee: input.condoFee,
        propertyTax: input.propertyTax,
        address: await resolveAddressCoordinates(input.address, this.geocoder, existing.address),
        media: input.media,
      },
      input.actorId,
    )

    if (!property) {
      throw new PropertyNotFoundError()
    }

    return property
  }
}
