import { Prisma } from '@prisma/client'
import { prisma } from '@server/db/prisma'
import type { ProfileAddressRepository } from '../application/ports/profile-address-repository.port'
import type { PublicProfileAddress, PublicProfileTarget } from '../types/profile-address'
import { PublicProfileAddressTakenError } from '../domain/profile-address-errors'

function toAddress(row: {
  handle: string
  brokerUserId: string | null
  agencyTenantId: string | null
}): PublicProfileAddress {
  return row.brokerUserId
    ? { kind: 'broker', profileId: row.brokerUserId, handle: row.handle }
    : { kind: 'agency', profileId: row.agencyTenantId!, handle: row.handle }
}

export class PrismaProfileAddressRepository implements ProfileAddressRepository {
  async findByHandle(handle: string) {
    const row = await prisma.publicProfileAddress.findUnique({ where: { handle } })
    return row ? toAddress(row) : null
  }
  async findByProfile(target: PublicProfileTarget) {
    const row = await prisma.publicProfileAddress.findUnique({
      where:
        target.kind === 'broker'
          ? { brokerUserId: target.profileId }
          : { agencyTenantId: target.profileId },
    })
    return row ? toAddress(row) : null
  }
  async save(target: PublicProfileTarget, handle: string, actorId: string) {
    const owner =
      target.kind === 'broker'
        ? { brokerUserId: target.profileId }
        : { agencyTenantId: target.profileId }
    try {
      return toAddress(
        await prisma.publicProfileAddress.upsert({
          where: owner,
          create: { ...owner, handle, updatedById: actorId },
          update: { handle, updatedById: actorId },
        }),
      )
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
        throw new PublicProfileAddressTakenError()
      throw error
    }
  }
}
