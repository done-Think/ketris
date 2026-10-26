import { prisma } from '@server/db/prisma'
import type { ContractDocumentRepository } from '../application/ports/contract-document-repository.port'
import type { ContractReadScope } from '../types/contract-entity'
import type { ContractDocumentDescriptor } from '../types/documents'
import type { ContractWorkflowScope } from '../types/workflow'
import { ContractDocumentOutdatedError } from '../domain/errors'
import { contractDocumentObjectKey } from '../domain/contract-document'
import { contractReadWhere, usuarioRefSelect } from './contract-query'
import { runManagedContractMutation } from './contract-write-transaction'
import { recordContractAudit } from './contract-audit'
import { toDomainContractDocument } from './prisma-contract.mapper'

export class PrismaContractDocumentRepository implements ContractDocumentRepository {
  async context(contractId: string, scope: ContractReadScope) {
    const row = await prisma.contrato.findFirst({
      where: { id: contractId, ...contractReadWhere(scope) },
      select: { id: true, tenantId: true, revisaoDados: true },
    })
    return row ? { id: row.id, tenantId: row.tenantId, dataRevision: row.revisaoDados } : null
  }

  async find(contractId: string, documentId: string, scope: ContractReadScope) {
    const row = await prisma.documentoContrato.findFirst({
      where: { id: documentId, contratoId: contractId, contrato: contractReadWhere(scope) },
      select: {
        id: true,
        nome: true,
        objectKey: true,
        sha256: true,
        tamanhoBytes: true,
        contrato: { select: { id: true, tenantId: true } },
      },
    })
    return row
      ? {
          id: row.id,
          contractId: row.contrato.id,
          tenantId: row.contrato.tenantId,
          name: row.nome,
          objectKey: row.objectKey,
          sha256: row.sha256,
          size: row.tamanhoBytes,
        }
      : null
  }

  create(descriptor: ContractDocumentDescriptor, scope: ContractWorkflowScope) {
    return runManagedContractMutation(descriptor.contractId, scope, async (tx, contract) => {
      if (contract.revisaoDados !== descriptor.dataRevision)
        throw new ContractDocumentOutdatedError()
      const existing = contract.documentos.find((document) => document.id === descriptor.id)
      if (existing) return toDomainContractDocument(existing)
      const document = await tx.documentoContrato.create({
        data: {
          id: descriptor.id,
          contratoId: contract.id,
          nome: descriptor.name,
          objectKey: contractDocumentObjectKey(descriptor),
          sha256: descriptor.sha256,
          tamanhoBytes: descriptor.size,
          enviadoPorId: scope.actorId,
          revisaoContrato: contract.revisaoDados,
        },
        include: { enviadoPor: usuarioRefSelect },
      })
      await recordContractAudit(tx, {
        tenantId: contract.tenantId,
        contractId: contract.id,
        actorUserId: scope.actorId,
        action: 'DOCUMENT_UPLOADED',
        documentId: document.id,
        changedFields: ['documents'],
      })
      return toDomainContractDocument(document)
    })
  }
}
