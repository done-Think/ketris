import { resolveContractManageScope } from '../../domain/contract-access-rules'
import { ContractNotFoundError } from '../../domain/errors'
import { contractDocumentObjectKey } from '../../domain/contract-document'
import { CONTRACT_DOCUMENT_UPLOAD_TTL_SECONDS } from '../../config/document-limits'
import type { ContractDocumentRepository } from '../ports/contract-document-repository.port'
import type {
  ContractDocumentIds,
  ContractDocumentStorage,
  ContractDocumentUploadTickets,
} from '../ports/contract-document-storage.port'
import type { InitContractDocumentUploadInput } from '../../types/documents'
import type { ContractReadScope } from '../../types/contract-entity'

export class InitContractDocumentUploadUseCase {
  constructor(
    private readonly repository: ContractDocumentRepository,
    private readonly storage: ContractDocumentStorage,
    private readonly tickets: ContractDocumentUploadTickets,
    private readonly ids: ContractDocumentIds,
  ) {}

  async execute(input: InitContractDocumentUploadInput) {
    const permission = resolveContractManageScope(input.actorId, input.actorRole)
    const scope: ContractReadScope = {
      kind: 'tenant',
      tenantId: input.actorTenantId,
      ...permission,
    }
    const contract = await this.repository.context(input.contractId, scope)
    if (!contract) throw new ContractNotFoundError()
    const descriptor = {
      id: this.ids.generate(),
      tenantId: contract.tenantId,
      contractId: contract.id,
      actorId: input.actorId,
      name: input.name,
      size: input.size,
      sha256: input.sha256,
      dataRevision: contract.dataRevision,
    }
    const location = await this.storage.uploadLocation(
      contractDocumentObjectKey(descriptor),
      descriptor,
    )
    return {
      uploadUrl: location.url,
      headers: location.headers,
      uploadToken: await this.tickets.issue(descriptor),
      expiresAt: new Date(Date.now() + CONTRACT_DOCUMENT_UPLOAD_TTL_SECONDS * 1000),
    }
  }
}
