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
    const target = transition.action === 'CANCEL' ? 'CANCELADO' : 'ENCERRADO'
    if (contract.status === target) return toDomainContract(contract, protector)
    assertContractTransition(contract.status, transition.action)
    const timestamp = new Date()
    await tx.contrato.update({
      where: { id: contractId, tenantId: scope.tenantId },
      data: {
        status: target,
        ...(transition.action === 'CANCEL'
          ? {
              canceladoEm: timestamp,
              canceladoPorId: scope.actorId,
              motivoCancelamento: transition.reason,
            }
          : {
              encerradoEm: timestamp,
              encerradoPorId: scope.actorId,
              motivoEncerramento: transition.reason,
            }),
      },
    })
    if (transition.action === 'CLOSE') {
      const others = await tx.contrato.count({
        where: {
          tenantId: scope.tenantId,
          imovelId: contract.imovelId,
          id: { not: contractId },
          status: 'ATIVO',
        },
      })
      if (!others) {
        const property = await tx.imovel.findFirst({
          where: { id: contract.imovelId, tenantId: scope.tenantId },
          select: { finalidade: true, status: true },
        })
        if (property?.finalidade === 'ALUGUEL' && property.status !== 'SOLD')
          await tx.imovel.update({
            where: { id: contract.imovelId, tenantId: scope.tenantId },
            data: { status: 'INACTIVE' },
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
