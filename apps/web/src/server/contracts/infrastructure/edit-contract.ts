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
    if (new Set(row.partes.map((party) => party.papel)).size !== row.partes.length)
      throw new ConflictError('Revise as partes duplicadas do contrato antes de editar.')
    const changedFields = contractChangedFields(contract, data)
    if (!changedFields.length) return contract
    const roles = new Set(data.parties.map((party) => party.role))
    const removedIds = row.partes
      .filter((party) => !roles.has(party.papel))
      .map((party) => party.id)
    if (removedIds.length)
      await tx.parteContrato.deleteMany({
        where: {
          id: { in: removedIds },
          contratoId: contractId,
          contrato: { tenantId: scope.tenantId },
        },
      })
    for (const party of data.parties) {
      const existing = row.partes.find((candidate) => candidate.papel === party.role)
      const previous = contract.parties.find((candidate) => candidate.role === party.role)
      if (previous && sameContractPartyValues(previous, party)) continue
      const id = existing?.id ?? randomUUID()
      const values = {
        nome: party.name,
        cpf: protector.encryptCpf(party.cpf, { tenantId: scope.tenantId, partyId: id }),
        email: party.email,
        telefone: party.phone,
      }
      if (existing) {
        const unlink =
          party.role === 'LOCATARIO' &&
          normalizeEmail(existing.email) !== normalizeEmail(party.email)
        await tx.parteContrato.update({
          where: { id, contratoId: contractId, contrato: { tenantId: scope.tenantId } },
          data: { ...values, ...(unlink ? { usuarioId: null } : {}) },
        })
        if (unlink && existing.usuarioId && !changedFields.includes('parties.userId'))
          changedFields.push('parties.userId')
      } else
        await tx.parteContrato.create({
          data: {
            id,
            contratoId: contractId,
            papel: party.role,
            ...values,
            assinatura: { create: {} },
          },
        })
    }
    await tx.contrato.update({
      where: { id: contractId, tenantId: scope.tenantId },
      data: {
        tipo: data.type,
        valor: data.amount,
        diaVencimento: data.dueDay,
        dataInicio: data.startDate,
        dataFim: data.endDate,
        indiceReajuste: data.adjustmentIndex,
        tipoGarantia: data.guaranteeType,
        observacoes: data.notes,
        revisaoDados: { increment: 1 },
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
