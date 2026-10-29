import type { Prisma } from '@prisma/client'
import type { LinkContractPartyUserData } from '../types/contract-party-user-link'

export async function linkContractPartyUser(
  db: Pick<Prisma.TransactionClient, 'contractParty'>,
  input: LinkContractPartyUserData,
): Promise<boolean> {
  const result = await db.contractParty.updateMany({
    where: {
      id: input.partyId,
      contractId: input.contractId,
      contract: { tenantId: input.tenantId },
      role: 'RENTER',
      email: { equals: input.email, mode: 'insensitive' },
      OR: [{ userId: null }, { userId: input.userId }],
    },
    data: { userId: input.userId },
  })
  return result.count === 1
}
