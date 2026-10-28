import type { ContractDataProtector } from '../application/ports/contract-data-protector.port'
import type { ContractManualSignatureEvidence, ContractWorkflowScope } from '../types/workflow'
import { insertCharge } from '@server/financial/infrastructure/charge-writes'
import {
  ContractDocumentNotFoundError,
  ContractDocumentOutdatedError,
  ContractEvidenceRequiredError,
  ContractPartyAlreadySignedError,
  ContractPartyNotFoundError,
  ContractTransitionNotAllowedError,
} from '../domain/errors'
import { CONTRACT_DOCUMENT_MAX_BYTES } from '../config/document-limits'
import { computeNextDueDate } from '../domain/contract-billing'
import { readContractAfterWrite, runManagedContractMutation } from './contract-write-transaction'
import { recordContractAudit } from './contract-audit'

export function registerManualContractSignature(
  protector: ContractDataProtector,
  contractId: string,
  partyId: string,
  scope: ContractWorkflowScope,
  evidence: ContractManualSignatureEvidence,
) {
  return runManagedContractMutation(contractId, scope, async (tx, contract) => {
    if (['ACTIVE', 'CLOSED', 'CANCELED'].includes(contract.status))
      throw new ContractTransitionNotAllowedError()
    const party = contract.parties.find((candidate) => candidate.id === partyId)
    if (!party) throw new ContractPartyNotFoundError()
    if (party.signature?.status === 'SIGNED') throw new ContractPartyAlreadySignedError()
    if (
      !contract.parties.some((candidate) => candidate.role === 'LANDLORD') ||
      !contract.parties.some((candidate) => candidate.role === 'RENTER')
    )
      throw new ContractTransitionNotAllowedError()
    const document = contract.documents.find((candidate) => candidate.id === evidence.documentId)
    if (!document) throw new ContractDocumentNotFoundError()
    if (
      !document.objectKey ||
      !document.sha256 ||
      !/^[a-f0-9]{64}$/.test(document.sha256) ||
      !document.sizeBytes ||
      document.sizeBytes > CONTRACT_DOCUMENT_MAX_BYTES
    )
      throw new ContractEvidenceRequiredError()
    if (document.contractRevision !== contract.dataRevision)
      throw new ContractDocumentOutdatedError()
    const signature = {
      status: 'SIGNED' as const,
      signedAt: new Date(),
      signedById: scope.actorId,
      method: 'MANUAL' as const,
      documentId: document.id,
      documentSha256: document.sha256,
      registeredIp: evidence.clientIp,
      registeredUserAgent: evidence.userAgent?.slice(0, 512) ?? null,
    }
    if (party.signature) {
      const changed = await tx.contractSignature.updateMany({
        where: {
          id: party.signature.id,
          contractPartyId: partyId,
          status: 'PENDING',
          contractParty: { contractId: contractId, contract: { tenantId: scope.tenantId } },
        },
        data: signature,
      })
      if (!changed.count) throw new ContractPartyAlreadySignedError()
    } else await tx.contractSignature.create({ data: { contractPartyId: partyId, ...signature } })
    const parties = await tx.contractParty.findMany({
      where: { contractId: contractId, contract: { tenantId: scope.tenantId } },
      select: { signature: { select: { status: true } } },
    })
    const activate = parties.every((candidate) => candidate.signature?.status === 'SIGNED')
    if (activate) {
      const property = await tx.property.findFirstOrThrow({
        where: { id: contract.propertyId, tenantId: scope.tenantId },
        select: { purpose: true },
      })
      await tx.contract.update({
        where: { id: contractId, tenantId: scope.tenantId },
        data: { status: 'ACTIVE', activatedAt: new Date(), activatedById: scope.actorId },
      })
      await tx.property.update({
        where: { id: contract.propertyId, tenantId: scope.tenantId },
        data: {
          status: property.purpose === 'RENT' ? 'RENTED' : 'SOLD',
          updatedById: scope.actorId,
        },
      })
      await insertCharge(tx, {
        tenantId: scope.tenantId,
        contractId,
        description: null,
        type: 'RECEIVABLE',
        amount: contract.amount,
        dueDate: computeNextDueDate(contract.dueDay, new Date()),
        status: 'PENDING',
        createdById: scope.actorId,
        actorType: 'SYSTEM',
      })
    }
    await recordContractAudit(tx, {
      tenantId: scope.tenantId,
      contractId,
      actorUserId: scope.actorId,
      action: 'MANUAL_SIGNATURE_REGISTERED',
      changedFields: activate ? ['parties.signature', 'status'] : ['parties.signature'],
      fromStatus: contract.status,
      toStatus: activate ? 'ACTIVE' : contract.status,
      documentId: document.id,
    })
    return readContractAfterWrite(tx, contractId, scope.tenantId, protector)
  })
}
