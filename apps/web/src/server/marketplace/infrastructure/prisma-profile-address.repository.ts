import { Prisma } from '@prisma/client'
import { prisma } from '@server/db/prisma'
import type { ProfileAddressRepository } from '../application/ports/profile-address-repository.port'
import type { PublicProfileAddress, PublicProfileTarget } from '../types/profile-address'
import {
  PublicProfileAddressTakenError,
  PublicProfileNotPublishedError,
} from '../domain/profile-address-errors'

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
  async isPublished(target: PublicProfileTarget) {
    return target.kind === 'broker'
      ? (await prisma.brokerPublicProfile.count({
          where: { userId: target.profileId, status: 'PUBLISHED' },
        })) > 0
      : (await prisma.agencyPublicProfile.count({
          where: { tenantId: target.profileId, status: 'PUBLISHED' },
        })) > 0
  }
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
      return await prisma.$transaction(async (tx) => {
        const profiles =
          target.kind === 'broker'
            ? await tx.$queryRaw<
                Pick<PublicProfileTarget, 'profileId'>[]
              >`SELECT "userId" AS "profileId" FROM broker_public_profiles WHERE "userId" = ${target.profileId} AND status = 'PUBLISHED' FOR UPDATE`
            : await tx.$queryRaw<
                Pick<PublicProfileTarget, 'profileId'>[]
              >`SELECT "tenantId" AS "profileId" FROM agency_public_profiles WHERE "tenantId" = ${target.profileId} AND status = 'PUBLISHED' FOR UPDATE`
        if (profiles.length === 0) throw new PublicProfileNotPublishedError()
        return toAddress(
          await tx.publicProfileAddress.upsert({
            where: owner,
            create: { ...owner, handle, updatedById: actorId },
            update: { handle, updatedById: actorId },
          }),
        )
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
        throw new PublicProfileAddressTakenError()
      throw error
    }
  }
}
