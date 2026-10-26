import type {
  ContractDocumentDescriptor,
  ContractDocumentObjectInfo,
  ContractDocumentUploadLocation,
} from '../../types/documents'

export interface ContractDocumentStorage {
  uploadLocation(
    key: string,
    descriptor: ContractDocumentDescriptor,
  ): Promise<ContractDocumentUploadLocation>
  inspect(key: string): Promise<ContractDocumentObjectInfo>
  downloadUrl(key: string, name: string): Promise<string>
}

export interface ContractDocumentUploadTickets {
  issue(descriptor: ContractDocumentDescriptor): Promise<string>
  verify(token: string): Promise<ContractDocumentDescriptor>
}

export interface ContractDocumentIds {
  generate(): string
}
