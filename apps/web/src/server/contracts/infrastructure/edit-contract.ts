import { randomUUID } from 'node:crypto'
import { normalizeEmail } from '@server/shared/normalize-email'
import { ConflictError } from '@server/shared/errors'
import type { ContractDataProtector } from '../application/ports/contract-data-protector.port'
import type { ContractEditData, ContractWorkflowScope } from '../types/workflow'
import {
  assertContractEditable,
  contractChangedFields,
  sameContractPartyValues,
} from '../domain/contract-workflow-rules'
import { toDomainContract } from './prisma-contract.mapper'
import { readContractAfterWrite, runManagedContractMutation } from './contract-write-transaction'
import { recordContractAudit } from './contract-audit'

export function editContract(
  protector: ContractDataProtector,
  contractId: string,
  scope: ContractWorkflowScope,
  data: ContractEditData,
) {
  return runManagedContractMutation(contractId, scope, async (tx, row) => {
    const contract = toDomainContract(row, protector)
    assertContractEditable(contract)
    if (new Set(row.parties.map((party) => party.role)).size !== row.parties.length)
      throw new ConflictError('Revise as partes duplicadas do contrato antes de editar.')
    const changedFields = contractChangedFields(contract, data)
    if (!changedFields.length) return contract
    const roles = new Set(data.parties.map((party) => party.role))
    const removedIds = row.parties
      .filter((party) => !roles.has(party.role))
      .map((party) => party.id)
    if (removedIds.length)
      await tx.contractParty.deleteMany({
        where: {
          id: { in: removedIds },
          contractId: contractId,
          contract: { tenantId: scope.tenantId },
        },
      })
    for (const party of data.parties) {
      const existing = row.parties.find((candidate) => candidate.role === party.role)
      const previous = contract.parties.find((candidate) => candidate.role === party.role)
      if (previous && sameContractPartyValues(previous, party)) continue
      const id = existing?.id ?? randomUUID()
      const values = {
        name: party.name,
        cpf: protector.encryptCpf(party.cpf, { tenantId: scope.tenantId, partyId: id }),
        email: party.email,
        phone: party.phone,
      }
      if (existing) {
        const unlink =
          party.role === 'RENTER' && normalizeEmail(existing.email) !== normalizeEmail(party.email)
        await tx.contractParty.update({
          where: { id, contractId: contractId, contract: { tenantId: scope.tenantId } },
          data: { ...values, ...(unlink ? { userId: null } : {}) },
        })
        if (unlink && existing.userId && !changedFields.includes('parties.userId'))
          changedFields.push('parties.userId')
      } else
        await tx.contractParty.create({
          data: {
            id,
            contractId: contractId,
            tenantId: scope.tenantId,
            role: party.role,
            ...values,
            signature: { create: {} },
          },
        })
    }
    await tx.contract.update({
      where: { id: contractId, tenantId: scope.tenantId },
      data: {
        type: data.type,
        amount: data.amount,
        dueDay: data.dueDay,
        startDate: data.startDate,
        endDate: data.endDate,
        adjustmentIndex: data.adjustmentIndex,
        guaranteeType: data.guaranteeType,
        notes: data.notes,
        dataRevision: { increment: 1 },
      },
    })
    await recordContractAudit(tx, {
      tenantId: scope.tenantId,
      contractId,
      actorUserId: scope.actorId,
      action: 'UPDATED',
      changedFields,
    })
    return readContractAfterWrite(tx, contractId, scope.tenantId, protector)
  })
}
