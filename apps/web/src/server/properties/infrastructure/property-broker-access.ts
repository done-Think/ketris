import { Prisma } from '@prisma/client'
import { PropertyBrokerValidationError } from '../domain/errors'
import type { PropertyTransaction } from '../types/prisma-property-repository'
import { activePropertyBrokerWhere } from './property-broker-eligibility'

export async function lockPropertyBrokers(
  tx: PropertyTransaction,
  tenantId: string,
  ids: string[] = [],
): Promise<void> {
  if (!ids.length) return
  // Serialize grants with user deactivation so an access grant cannot survive a departure.
  await tx.$queryRaw(Prisma.sql`
    SELECT id FROM users WHERE "tenantId" = ${tenantId} AND id IN (${Prisma.join(ids)})
    ORDER BY id FOR UPDATE
  `)
  const count = await tx.user.count({
    where: { ...activePropertyBrokerWhere(tenantId), id: { in: ids } },
  })
  if (count !== ids.length) throw new PropertyBrokerValidationError()
}

export async function replacePropertyBrokers(
  tx: PropertyTransaction,
  tenantId: string,
  propertyId: string,
  ids: string[],
): Promise<void> {
  await tx.propertyBrokerAccess.deleteMany({ where: { tenantId, propertyId } })
  if (ids.length) {
    await tx.propertyBrokerAccess.createMany({
      data: ids.map((userId) => ({ tenantId, propertyId, userId })),
    })
  }
}
