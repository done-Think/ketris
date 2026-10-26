import type { ContractDataProtector } from '../application/ports/contract-data-protector.port'
import type { ContractManualSignatureEvidence, ContractWorkflowScope } from '../types/workflow'
import { nextSequentialCode } from '@server/shared/sequential-code'
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
    if (['ATIVO', 'ENCERRADO', 'CANCELADO'].includes(contract.status))
      throw new ContractTransitionNotAllowedError()
    const party = contract.partes.find((candidate) => candidate.id === partyId)
    if (!party) throw new ContractPartyNotFoundError()
    if (party.assinatura?.status === 'ASSINADA') throw new ContractPartyAlreadySignedError()
    if (
      !contract.partes.some((candidate) => candidate.papel === 'LOCADOR') ||
      !contract.partes.some((candidate) => candidate.papel === 'LOCATARIO')
    )
      throw new ContractTransitionNotAllowedError()
    const document = contract.documentos.find((candidate) => candidate.id === evidence.documentId)
    if (!document) throw new ContractDocumentNotFoundError()
    if (
      !document.objectKey ||
      !document.sha256 ||
      !/^[a-f0-9]{64}$/.test(document.sha256) ||
      !document.tamanhoBytes ||
      document.tamanhoBytes > CONTRACT_DOCUMENT_MAX_BYTES
    )
      throw new ContractEvidenceRequiredError()
    if (document.revisaoContrato !== contract.revisaoDados)
      throw new ContractDocumentOutdatedError()
    const signature = {
      status: 'ASSINADA' as const,
      assinadaEm: new Date(),
      assinadaPorId: scope.actorId,
      metodo: 'MANUAL' as const,
      documentoId: document.id,
      sha256Documento: document.sha256,
      ipRegistro: evidence.clientIp,
      userAgentRegistro: evidence.userAgent?.slice(0, 512) ?? null,
    }
    if (party.assinatura) {
      const changed = await tx.assinatura.updateMany({
        where: {
          id: party.assinatura.id,
          parteContratoId: partyId,
          status: 'PENDENTE',
          parteContrato: { contratoId: contractId, contrato: { tenantId: scope.tenantId } },
        },
        data: signature,
      })
      if (!changed.count) throw new ContractPartyAlreadySignedError()
    } else await tx.assinatura.create({ data: { parteContratoId: partyId, ...signature } })
    const parties = await tx.parteContrato.findMany({
      where: { contratoId: contractId, contrato: { tenantId: scope.tenantId } },
      select: { assinatura: { select: { status: true } } },
    })
    const activate = parties.every((candidate) => candidate.assinatura?.status === 'ASSINADA')
    if (activate) {
      const property = await tx.imovel.findFirstOrThrow({
        where: { id: contract.imovelId, tenantId: scope.tenantId },
        select: { finalidade: true },
      })
      await tx.contrato.update({
        where: { id: contractId, tenantId: scope.tenantId },
        data: { status: 'ATIVO', ativadoEm: new Date(), ativadoPorId: scope.actorId },
      })
      await tx.imovel.update({
        where: { id: contract.imovelId, tenantId: scope.tenantId },
        data: { status: property.finalidade === 'ALUGUEL' ? 'RENTED' : 'SOLD' },
      })
      await tx.cobranca.create({
        data: {
          tenantId: scope.tenantId,
          contratoId: contractId,
          codigo: await nextSequentialCode(tx, 'cobrancas', `COB-${new Date().getFullYear()}-`),
          tipo: 'A_RECEBER',
          valor: contract.valor,
          vencimento: computeNextDueDate(contract.diaVencimento, new Date()),
          status: 'PENDENTE',
        },
      })
    }
    await recordContractAudit(tx, {
      tenantId: scope.tenantId,
      contractId,
      actorUserId: scope.actorId,
      action: 'MANUAL_SIGNATURE_REGISTERED',
      changedFields: activate ? ['parties.signature', 'status'] : ['parties.signature'],
      fromStatus: contract.status,
      toStatus: activate ? 'ATIVO' : contract.status,
      documentId: document.id,
    })
    return readContractAfterWrite(tx, contractId, scope.tenantId, protector)
  })
}
