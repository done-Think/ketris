import type { Contract } from '../domain/contract.entity'
import type { ContractDataProtector } from '../application/ports/contract-data-protector.port'
import type {
  ContractWithRelations,
  UserRef,
  DocumentWithRelations,
} from '../types/prisma-contract-repository'

export function toContractActor(user: UserRef | null | undefined) {
  return user ? { id: user.id, name: user.name } : null
}

export function toDomainContract(
  contract: ContractWithRelations,
  protector: ContractDataProtector,
): Contract {
  return {
    id: contract.id,
    tenantId: contract.tenantId,
    propertyId: contract.propertyId,
    property: {
      title: contract.property.title,
      address: contract.property.address
        ? [
            contract.property.address.street,
            contract.property.address.neighborhood,
            contract.property.address.city,
          ]
            .filter(Boolean)
            .join(', ')
        : '',
    },
    opportunityId: contract.sourceOpportunityId,
    code: contract.code,
    type: contract.type,
    amount: contract.amount.toNumber(),
    dueDay: contract.dueDay,
    startDate: contract.startDate,
    endDate: contract.endDate,
    adjustmentIndex: contract.adjustmentIndex,
    guaranteeType: contract.guaranteeType,
    notes: contract.notes,
    status: contract.status,
    activatedAt: contract.activatedAt,
    activatedBy: toContractActor(contract.activatedBy),
    createdAt: contract.createdAt,
    updatedAt: contract.updatedAt,
    dataRevision: contract.dataRevision,
    createdBy: toContractActor(contract.createdBy),
    cancelledAt: contract.canceledAt,
    cancelledBy: toContractActor(contract.canceledBy),
    cancellationReason: contract.cancellationReason,
    closedAt: contract.closedAt,
    closedBy: toContractActor(contract.closedBy),
    closingReason: contract.closureReason,
    parties: contract.parties.map((parte) => ({
      id: parte.id,
      userId: parte.userId,
      role: parte.role,
      name: parte.name,
      cpf: protector.decryptCpf(parte.cpf, { tenantId: contract.tenantId, partyId: parte.id }),
      email: parte.email,
      phone: parte.phone,
      signatureStatus: parte.signature?.status ?? 'PENDING',
      signedAt: parte.signature?.signedAt ?? null,
      signedBy: toContractActor(parte.signature?.signedBy),
      signatureMethod: parte.signature?.method ?? null,
      signatureDocumentId: parte.signature?.documentId ?? null,
      signatureDocumentHash: parte.signature?.documentSha256 ?? null,
      createdAt: parte.createdAt,
      updatedAt: parte.updatedAt,
    })),
    documents: contract.documents.map(toDomainContractDocument),
  }
}

export function toDomainContractDocument(document: DocumentWithRelations) {
  return {
    id: document.id,
    name: document.name,
    url: document.url,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
    sha256: document.sha256,
    size: document.sizeBytes,
    uploadedBy: toContractActor(document.uploadedBy),
    contractRevision: document.contractRevision,
    canDownload: Boolean(document.objectKey && document.sha256),
  }
}
