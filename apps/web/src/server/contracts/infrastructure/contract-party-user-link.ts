import type { Prisma } from '@prisma/client'
import type { LinkContractPartyUserData } from '../types/contract-party-user-link'

export async function linkContractPartyUser(
  db: Pick<Prisma.TransactionClient, 'parteContrato'>,
  input: LinkContractPartyUserData,
): Promise<boolean> {
  const result = await db.parteContrato.updateMany({
    where: {
      id: input.partyId,
      contratoId: input.contractId,
      contrato: { tenantId: input.tenantId },
      papel: 'LOCATARIO',
      email: { equals: input.email, mode: 'insensitive' },
      OR: [{ usuarioId: null }, { usuarioId: input.userId }],
    },
    data: { usuarioId: input.userId },
  })
  return result.count === 1
}
