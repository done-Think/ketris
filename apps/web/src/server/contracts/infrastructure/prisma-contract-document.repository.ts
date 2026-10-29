import { prisma } from '@server/db/prisma'
import type { ContractDocumentRepository } from '../application/ports/contract-document-repository.port'
import type { ContractReadScope } from '../types/contract-entity'
import type { ContractDocumentDescriptor } from '../types/documents'
import type { ContractWorkflowScope } from '../types/workflow'
import { ContractDocumentOutdatedError } from '../domain/errors'
import { contractDocumentObjectKey } from '../domain/contract-document'
import { contractReadWhere, userReferenceSelect } from './contract-query'
import { runManagedContractMutation } from './contract-write-transaction'
import { recordContractAudit } from './contract-audit'
import { toDomainContractDocument } from './prisma-contract.mapper'

export class PrismaContractDocumentRepository implements ContractDocumentRepository {
  async context(contractId: string, scope: ContractReadScope) {
    const row = await prisma.contract.findFirst({
      where: { id: contractId, ...contractReadWhere(scope) },
      select: { id: true, tenantId: true, dataRevision: true },
    })
    return row ? { id: row.id, tenantId: row.tenantId, dataRevision: row.dataRevision } : null
  }

  async find(contractId: string, documentId: string, scope: ContractReadScope) {
    const row = await prisma.contractDocument.findFirst({
      where: { id: documentId, contractId: contractId, contract: contractReadWhere(scope) },
      select: {
        id: true,
        name: true,
        objectKey: true,
        sha256: true,
        sizeBytes: true,
        contract: { select: { id: true, tenantId: true } },
      },
    })
    return row
      ? {
          id: row.id,
          contractId: row.contract.id,
          tenantId: row.contract.tenantId,
          name: row.name,
          objectKey: row.objectKey,
          sha256: row.sha256,
          size: row.sizeBytes,
        }
      : null
  }

  create(descriptor: ContractDocumentDescriptor, scope: ContractWorkflowScope) {
    return runManagedContractMutation(descriptor.contractId, scope, async (tx, contract) => {
      if (contract.dataRevision !== descriptor.dataRevision)
        throw new ContractDocumentOutdatedError()
      const existing = contract.documents.find((document) => document.id === descriptor.id)
      if (existing) return toDomainContractDocument(existing)
      const document = await tx.contractDocument.create({
        data: {
          id: descriptor.id,
          contractId: contract.id,
          name: descriptor.name,
          objectKey: contractDocumentObjectKey(descriptor),
          sha256: descriptor.sha256,
          sizeBytes: descriptor.size,
          uploadedById: scope.actorId,
          contractRevision: contract.dataRevision,
        },
        include: { uploadedBy: userReferenceSelect },
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
