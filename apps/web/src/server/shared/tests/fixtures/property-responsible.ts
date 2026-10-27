import type { Prisma } from '@prisma/client'

export async function propertyResponsibleId(
  db: Pick<Prisma.TransactionClient, 'imovel'>,
  imovelId: string,
): Promise<string> {
  const property = await db.imovel.findUniqueOrThrow({
    where: { id: imovelId },
    select: { responsavelId: true },
  })

  return property.responsavelId
}
