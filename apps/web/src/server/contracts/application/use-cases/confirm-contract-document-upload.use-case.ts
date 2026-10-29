import { ForbiddenError } from '@server/shared/errors'
import { resolveContractManageScope } from '../../domain/contract-access-rules'
import {
  ContractNotFoundError,
  ContractDocumentInvalidError,
  ContractDocumentOutdatedError,
} from '../../domain/errors'
import { contractDocumentObjectKey } from '../../domain/contract-document'
import { CONTRACT_DOCUMENT_CONTENT_TYPE } from '../../config/document-limits'
import type { ContractDocumentRepository } from '../ports/contract-document-repository.port'
import type {
  ContractDocumentStorage,
  ContractDocumentUploadTickets,
} from '../ports/contract-document-storage.port'
import type { ConfirmContractDocumentUploadInput } from '../../types/documents'
import type { ContractReadScope } from '../../types/contract-entity'

export class ConfirmContractDocumentUploadUseCase {
  constructor(
    private readonly repository: ContractDocumentRepository,
    private readonly storage: ContractDocumentStorage,
    private readonly tickets: ContractDocumentUploadTickets,
  ) {}

  async execute(input: ConfirmContractDocumentUploadInput) {
    const permission = resolveContractManageScope(input.actorId, input.actorRole)
    const descriptor = await this.tickets.verify(input.uploadToken)
    if (
      descriptor.actorId !== input.actorId ||
      descriptor.tenantId !== input.actorTenantId ||
      descriptor.contractId !== input.contractId
    )
      throw new ForbiddenError(
        'A autorização de envio não corresponde ao contrato e usuário atuais.',
      )
    const readScope: ContractReadScope = {
      kind: 'tenant',
      tenantId: input.actorTenantId,
      ...permission,
    }
    const contract = await this.repository.context(input.contractId, readScope)
    if (!contract) throw new ContractNotFoundError()
    if (contract.dataRevision !== descriptor.dataRevision) throw new ContractDocumentOutdatedError()
    const info = await this.storage.inspect(contractDocumentObjectKey(descriptor))
    if (
      !info.pdf ||
      info.contentType !== CONTRACT_DOCUMENT_CONTENT_TYPE ||
      info.size !== descriptor.size ||
      info.sha256 !== descriptor.sha256
    )
      throw new ContractDocumentInvalidError()
    return this.repository.create(descriptor, {
      tenantId: input.actorTenantId,
      actorId: input.actorId,
      ...permission,
    })
  }
}
