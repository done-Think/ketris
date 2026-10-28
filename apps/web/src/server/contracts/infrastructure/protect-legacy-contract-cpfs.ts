import type { PrismaClient } from '@prisma/client'
import { AesContractDataProtector } from './aes-contract-data-protector'
import { recordContractAudit } from './contract-audit'
import type { ContractCpfMigrationScope } from '../types/data-protection'

export async function protectLegacyContractCpfs(
  prisma: PrismaClient,
  scope?: ContractCpfMigrationScope,
): Promise<number> {
  const protector = new AesContractDataProtector()
  protector.validateConfiguration()
  let protectedCount = 0
  while (true) {
    const parties = await prisma.contractParty.findMany({
      where: {
        NOT: { cpf: { startsWith: 'enc:' } },
        ...(scope ? { contract: { tenantId: scope.tenantId } } : {}),
      },
      select: { id: true, cpf: true, contractId: true, contract: { select: { tenantId: true } } },
      orderBy: { id: 'asc' },
      take: 100,
    })
    if (!parties.length) return protectedCount
    protectedCount += await prisma.$transaction(async (tx) => {
      const contracts = new Map(parties.map((party) => [party.contractId, party.contract.tenantId]))
      for (const id of [...contracts.keys()].sort()) {
        const tenantId = contracts.get(id)
        await tx.$queryRaw`SELECT id FROM "contracts" WHERE id = ${id} AND "tenantId" = ${tenantId} FOR UPDATE`
      }
      let changed = 0
      for (const party of parties) {
        const cpf = protector.encryptCpf(party.cpf, {
          tenantId: party.contract.tenantId,
          partyId: party.id,
        })
        const result = await tx.contractParty.updateMany({
          where: { id: party.id, cpf: party.cpf, contract: { tenantId: party.contract.tenantId } },
          data: { cpf },
        })
        if (result.count) {
          await recordContractAudit(tx, {
            tenantId: party.contract.tenantId,
            contractId: party.contractId,
            actorType: 'SYSTEM',
            action: 'UPDATED',
            changedFields: ['parties.cpfProtection'],
          })
          changed += result.count
        }
      }
      return changed
    })
  }
}
