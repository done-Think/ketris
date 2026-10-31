import { assertAgencyProfileAccess, assertBrokerProfileAccess } from '../authorization'
import type { ProfileAddressRepository } from '../ports/profile-address-repository.port'
import type {
  OwnPublicProfileAddress,
  ProfileAddressInput,
  PublicProfileTarget,
} from '../../types/profile-address'
import {
  publicProfileHandleSchema,
  saveProfileAddressSchema,
} from '../../schemas/profile-address.schema'
import { isReservedPublicProfileHandle } from '@shared/utils/public-profile-handle'
import { PublicProfileNotPublishedError } from '../../domain/profile-address-errors'

function ownTarget(input: ProfileAddressInput): PublicProfileTarget {
  if (input.kind === 'broker') {
    assertBrokerProfileAccess(input.actorRole)
    return { kind: input.kind, profileId: input.actorId }
  }
  assertAgencyProfileAccess(input.actorRole)
  return { kind: input.kind, profileId: input.actorTenantId }
}

export class ProfileAddressUseCase {
  constructor(private readonly addresses: ProfileAddressRepository) {}

  async getOwn(input: ProfileAddressInput): Promise<OwnPublicProfileAddress> {
    const target = ownTarget(input)
    const address = await this.addresses.findByProfile(target)
    return { ...target, handle: address?.handle ?? null }
  }
  async isAvailable(input: ProfileAddressInput & { handle: string }) {
    const target = ownTarget(input)
    const handle = publicProfileHandleSchema.parse(input.handle)
    if (!(await this.addresses.isPublished(target))) throw new PublicProfileNotPublishedError()
    if (isReservedPublicProfileHandle(handle)) return { available: false }
    const address = await this.addresses.findByHandle(handle)
    return {
      available:
        !address || (address.kind === target.kind && address.profileId === target.profileId),
    }
  }
  async save(input: ProfileAddressInput & { handle: string }) {
    const target = ownTarget(input)
    const { handle } = saveProfileAddressSchema.parse({ handle: input.handle })
    return this.addresses.save(target, handle, input.actorId)
  }
  async resolve(handle: string) {
    const parsed = publicProfileHandleSchema.safeParse(handle)
    return parsed.success ? this.addresses.findByHandle(parsed.data) : null
  }
  async findForProfile(target: PublicProfileTarget) {
    return this.addresses.findByProfile(target)
  }
}
