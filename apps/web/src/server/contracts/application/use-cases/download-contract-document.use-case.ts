import { resolveContractReadScope } from '../../domain/contract-access-rules'
import { ContractDocumentNotFoundError, ContractDocumentInvalidError } from '../../domain/errors'
import { contractDocumentObjectKey } from '../../domain/contract-document'
import { CONTRACT_DOCUMENT_DOWNLOAD_TTL_SECONDS } from '../../config/document-limits'
import type { ContractDocumentRepository } from '../ports/contract-document-repository.port'
import type { ContractDocumentStorage } from '../ports/contract-document-storage.port'
import type { DownloadContractDocumentInput } from '../../types/documents'

export class DownloadContractDocumentUseCase {
  constructor(
    private readonly repository: ContractDocumentRepository,
    private readonly storage: ContractDocumentStorage,
  ) {}

  async execute(input: DownloadContractDocumentInput) {
    const scope = resolveContractReadScope(input.actorTenantId, input.actorId, input.actorPapel)
    const document = await this.repository.find(input.contractId, input.documentId, scope)
    if (!document || !document.objectKey || !document.sha256)
      throw new ContractDocumentNotFoundError()
    if (
      document.objectKey !==
      contractDocumentObjectKey({
        tenantId: document.tenantId,
        contractId: document.contractId,
        id: document.id,
      })
    )
      throw new ContractDocumentNotFoundError()
    const info = await this.storage.inspect(document.objectKey)
    if (!info.pdf || info.sha256 !== document.sha256 || info.size !== document.size)
      throw new ContractDocumentInvalidError()
    return {
      url: await this.storage.downloadUrl(document.objectKey, document.name),
      expiresAt: new Date(Date.now() + CONTRACT_DOCUMENT_DOWNLOAD_TTL_SECONDS * 1000),
    }
  }
}
