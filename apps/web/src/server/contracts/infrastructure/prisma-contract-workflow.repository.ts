import { prisma } from '@server/db/prisma'
import type { ContractWorkflowRepository } from '../application/ports/contract-workflow-repository.port'
import type { ContractDataProtector } from '../application/ports/contract-data-protector.port'
import type { ContractEditData, ContractTransition, ContractWorkflowScope } from '../types/workflow'
import type { ContractReadScope } from '../types/contract-entity'
import type { ContractManualSignatureEvidence } from '../types/workflow'
import { ContractNotFoundError } from '../domain/errors'
import { editContract } from './edit-contract'
import { transitionContract } from './transition-contract'
import { registerManualContractSignature } from './register-manual-contract-signature'
import { contractReadWhere } from './contract-query'
import { toContractActor } from './prisma-contract.mapper'

export class PrismaContractWorkflowRepository implements ContractWorkflowRepository {
  constructor(private readonly protector: ContractDataProtector) {}

  edit(contractId: string, scope: ContractWorkflowScope, data: ContractEditData) {
    return editContract(this.protector, contractId, scope, data)
  }

  transition(contractId: string, scope: ContractWorkflowScope, transition: ContractTransition) {
    return transitionContract(this.protector, contractId, scope, transition)
  }

  signParty(
    contractId: string,
    partyId: string,
    scope: ContractWorkflowScope,
    evidence: ContractManualSignatureEvidence,
  ) {
    return registerManualContractSignature(this.protector, contractId, partyId, scope, evidence)
  }

  history(contractId: string, scope: ContractReadScope, page: number, pageSize: number) {
    return prisma.$transaction(
      async (tx) => {
        const contract = await tx.contrato.findFirst({
          where: { id: contractId, ...contractReadWhere(scope) },
          select: { id: true, tenantId: true },
        })
        if (!contract) throw new ContractNotFoundError()
        const where = { contractId, tenantId: contract.tenantId }
        const rows = await tx.contractAuditEvent.findMany({
          where,
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          take: pageSize,
          skip: (page - 1) * pageSize,
          include: { actor: { select: { id: true, nome: true } } },
        })
        const totalCount = await tx.contractAuditEvent.count({ where })
        return {
          items: rows.map((row) => ({
            id: row.id,
            action: row.action,
            actor: toContractActor(row.actor),
            actorType: row.actorType,
            changedFields: row.changedFields,
            fromStatus: row.fromStatus,
            toStatus: row.toStatus,
            reason: row.reason,
            documentId: row.documentId,
            createdAt: row.createdAt,
          })),
          totalCount,
          page,
          pageSize,
        }
      },
      { isolationLevel: 'RepeatableRead' },
    )
  }
}
