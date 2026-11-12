import { assertPropertyBrokerChange } from '../property-broker-access-policy'
import type { PropertyBrokerDirectory } from '../ports/property-broker-directory.port'
import { assertPropertyMediaScope } from '../../domain/property-media-policy'
import { normalizeNegotiationListing } from '../../domain/property-negotiation-policy'
import { assertOwnerContactChange } from '../property-owner-contact-policy'
import type { PropertyOwnerContactDirectory } from '../ports/property-owner-contact-directory.port'
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
    private readonly ownerContacts?: PropertyOwnerContactDirectory,
    private readonly brokers?: PropertyBrokerDirectory,
  ) {}

  async execute(input: UpdatePropertyInput) {
    assertCanEditProperties(input.actorRole)

    const existing = await this.propertyRepository.findByTenantAndId(input.actorTenantId, input.id)

    if (!existing) {
      throw new PropertyNotFoundError()
    }

    assertPropertyAccess(existing, input.actorId, input.actorRole)
    await assertPropertyBrokerChange(
      input.actorTenantId,
      input.actorRole,
      input.brokerIds,
      this.brokers,
    )
    const listing = input.listing
      ? {
          ...input.listing,
          negotiationConditions:
            input.listing.negotiationConditions ?? existing.listing.negotiationConditions,
        }
      : input.purpose
        ? existing.listing
        : undefined
    await assertOwnerContactChange(
      input,
      input.ownerContactId,
      existing.ownerContactId,
      this.ownerContacts,
    )

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
        brokerIds: input.brokerIds,
        ownerId: ownerId,
        ownerContactId: input.ownerContactId,
        title: input.title,
        description: input.description,
        purpose: input.purpose,
        type: input.type,
        listing: normalizeNegotiationListing(listing, input.purpose ?? existing.purpose),
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
