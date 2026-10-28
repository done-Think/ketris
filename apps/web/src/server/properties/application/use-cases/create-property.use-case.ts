import { assertPropertyMediaScope } from '../../domain/property-media-policy'
import type { PropertyOwnerDirectory } from '../ports/property-owner-directory.port'
import { PropertyOwnerValidationError } from '../../domain/errors'
import type { CreatePropertyInput } from '../../types/use-case-inputs'
import { isPropertyOwner } from '@server/auth/domain/roles'

import { assertCanEditProperties } from '../authorization'
import type { PropertyRepository } from '../ports/property-repository.port'
import {
  unavailableAddressGeocoder,
  type AddressGeocoder,
} from '@server/shared/location/address-geocoder.port'
import { resolveAddressCoordinates } from '@server/shared/location/resolve-address-coordinates'

export class CreatePropertyUseCase {
  constructor(
    private readonly propertyRepository: PropertyRepository,
    private readonly ownerDirectory: PropertyOwnerDirectory,
    private readonly geocoder: AddressGeocoder = unavailableAddressGeocoder,
  ) {}

  execute(input: CreatePropertyInput) {
    assertCanEditProperties(input.actorRole)
    return this.createProperty(input)
  }

  private async createProperty(input: CreatePropertyInput) {
    assertPropertyMediaScope(input.actorTenantId, input.media)
    const ownerId = isPropertyOwner(input.actorRole) ? input.actorUserId : (input.ownerId ?? null)
    if (ownerId && !(await this.ownerDirectory.findActiveOwner(input.actorTenantId, ownerId))) {
      throw new PropertyOwnerValidationError()
    }
    return this.propertyRepository.create(
      {
        tenantId: input.actorTenantId,
        responsibleId: input.actorUserId,
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
        address: await resolveAddressCoordinates(input.address, this.geocoder),
        media: input.media,
      },
      input.actorUserId,
    )
  }
}
