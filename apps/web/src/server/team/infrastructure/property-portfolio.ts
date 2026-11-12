import { Prisma } from '@prisma/client'
import { prisma } from '@server/db/prisma'
import { InvalidTransferDestinationError } from '../domain/errors'
import type { TeamTransferCommand } from '../types/team-repository'

export async function lockPortfolioPeople(
  tx: Prisma.TransactionClient,
  { tenantId, sourceId, destinationId }: TeamTransferCommand,
): Promise<void> {
  await tx.$queryRaw(Prisma.sql`
    SELECT id FROM users WHERE "tenantId" = ${tenantId} AND id IN (${sourceId}, ${destinationId})
    ORDER BY id FOR UPDATE
  `)
  const destination = await tx.user.findFirst({
    where: {
      tenantId,
      id: destinationId,
      active: true,
      OR: [
        { role: 'OWNER' },
        {
          role: 'AGENT',
          membershipApprovedAt: { not: null },
          OR: [{ teamInvitation: null }, { teamInvitation: { acceptedAt: { not: null } } }],
        },
      ],
    },
    select: { id: true },
  })
  if (!destination) throw new InvalidTransferDestinationError()
}

export async function transferPropertyAccess(
  tx: Prisma.TransactionClient,
  { tenantId, sourceId, destinationId }: TeamTransferCommand,
): Promise<void> {
  const grants = await tx.propertyBrokerAccess.findMany({
    where: { tenantId, userId: sourceId },
    select: { propertyId: true },
  })
  if (!grants.length) return
  const destination = await tx.user.findFirst({
    where: {
      tenantId,
      id: destinationId,
      active: true,
      role: 'AGENT',
      membershipApprovedAt: { not: null },
    },
    select: { id: true },
  })
  if (destination) {
    await tx.propertyBrokerAccess.createMany({
      data: grants.map(({ propertyId }) => ({ tenantId, propertyId, userId: destinationId })),
      skipDuplicates: true,
    })
  }
  await tx.propertyBrokerAccess.deleteMany({ where: { tenantId, userId: sourceId } })
}

export async function propertyPortfolioCounts(tenantId: string, ids: string[]) {
  return prisma.$queryRaw<{ key: string; count: number }[]>(Prisma.sql`
    SELECT portfolio."userId" AS key, COUNT(DISTINCT portfolio."propertyId")::int AS count
    FROM (
      SELECT id AS "propertyId", "responsibleId" AS "userId" FROM properties
      WHERE "tenantId" = ${tenantId} AND status <> 'INACTIVE' AND "responsibleId" IN (${Prisma.join(ids)})
      UNION
      SELECT p.id AS "propertyId", a."userId" FROM property_broker_access a
      JOIN properties p ON p.id = a."propertyId" AND p."tenantId" = a."tenantId"
      JOIN users u ON u.id = a."userId" AND u."tenantId" = a."tenantId"
      WHERE a."tenantId" = ${tenantId} AND p.status <> 'INACTIVE'
        AND a."userId" IN (${Prisma.join(ids)}) AND u.active = true AND u.role = 'AGENT'
        AND u."membershipApprovedAt" IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM team_invitations invitation
          WHERE invitation."userId" = u.id AND invitation."acceptedAt" IS NULL)
    ) portfolio GROUP BY portfolio."userId"
  `)
}
