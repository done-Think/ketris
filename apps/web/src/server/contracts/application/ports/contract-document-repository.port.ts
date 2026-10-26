import type { ContractDocument } from '../../types/contract-entity'
import type { ContractReadScope } from '../../types/contract-entity'
import type { ContractWorkflowScope } from '../../types/workflow'
import type {
  ContractDocumentContext,
  ContractDocumentDescriptor,
  StoredContractDocument,
} from '../../types/documents'

export interface ContractDocumentRepository {
  context(contractId: string, scope: ContractReadScope): Promise<ContractDocumentContext | null>
  find(
    contractId: string,
    documentId: string,
    scope: ContractReadScope,
  ): Promise<StoredContractDocument | null>
  create(
    descriptor: ContractDocumentDescriptor,
    scope: ContractWorkflowScope,
  ): Promise<ContractDocument>
}
