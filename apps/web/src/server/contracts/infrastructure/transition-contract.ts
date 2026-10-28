import type { ContractDataProtector } from '../application/ports/contract-data-protector.port'
import type { ContractTransition, ContractWorkflowScope } from '../types/workflow'
import { assertContractTransition } from '../domain/contract-workflow-rules'
import { readContractAfterWrite, runManagedContractMutation } from './contract-write-transaction'
import { toDomainContract } from './prisma-contract.mapper'
import { recordContractAudit } from './contract-audit'

export function transitionContract(
  protector: ContractDataProtector,
  contractId: string,
  scope: ContractWorkflowScope,
  transition: ContractTransition,
) {
  return runManagedContractMutation(contractId, scope, async (tx, contract) => {
    const target = transition.action === 'CANCEL' ? 'CANCELED' : 'CLOSED'
    if (contract.status === target) return toDomainContract(contract, protector)
    assertContractTransition(contract.status, transition.action)
    const timestamp = new Date()
    await tx.contract.update({
      where: { id: contractId, tenantId: scope.tenantId },
      data: {
        status: target,
        ...(transition.action === 'CANCEL'
          ? {
              canceledAt: timestamp,
              canceledById: scope.actorId,
              cancellationReason: transition.reason,
            }
          : {
              closedAt: timestamp,
              closedById: scope.actorId,
              closureReason: transition.reason,
            }),
      },
    })
    if (transition.action === 'CLOSE') {
      const others = await tx.contract.count({
        where: {
          tenantId: scope.tenantId,
          propertyId: contract.propertyId,
          id: { not: contractId },
          status: 'ACTIVE',
        },
      })
      if (!others) {
        const property = await tx.property.findFirst({
          where: { id: contract.propertyId, tenantId: scope.tenantId },
          select: { purpose: true, status: true },
        })
        if (property?.purpose === 'RENT' && property.status !== 'SOLD')
          await tx.property.update({
            where: { id: contract.propertyId, tenantId: scope.tenantId },
            data: { status: 'INACTIVE', updatedById: scope.actorId },
          })
      }
    }
    await recordContractAudit(tx, {
      tenantId: scope.tenantId,
      contractId,
      actorUserId: scope.actorId,
      action: transition.action === 'CANCEL' ? 'CANCELLED' : 'CLOSED',
      fromStatus: contract.status,
      toStatus: target,
      reason: transition.reason,
      changedFields: ['status'],
    })
    return readContractAfterWrite(tx, contractId, scope.tenantId, protector)
  })
}
