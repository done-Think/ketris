import type { Prisma } from '@prisma/client'

export async function propertyResponsibleId(
  db: Pick<Prisma.TransactionClient, 'property'>,
  propertyId: string,
): Promise<string> {
  const property = await db.property.findUniqueOrThrow({
    where: { id: propertyId },
    select: { responsibleId: true },
  })

  return property.responsibleId
}
