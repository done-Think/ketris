import type { ContractMutationActor } from './workflow'

export interface ContractDocumentContext {
  id: string
  tenantId: string
  dataRevision: number
}

export interface ContractDocumentDescriptor {
  id: string
  tenantId: string
  contractId: string
  actorId: string
  name: string
  size: number
  sha256: string
  dataRevision: number
}

export interface StoredContractDocument {
  id: string
  contractId: string
  tenantId: string
  name: string
  objectKey: string | null
  sha256: string | null
  size: number | null
}

export interface ContractDocumentObjectInfo {
  size: number
  contentType: string | null
  sha256: string | null
  pdf: boolean
}

export interface ContractDocumentUploadLocation {
  url: string
  headers: Record<string, string>
}

export interface InitContractDocumentUploadInput extends ContractMutationActor {
  name: string
  size: number
  sha256: string
}

export interface ConfirmContractDocumentUploadInput extends ContractMutationActor {
  uploadToken: string
}

export interface DownloadContractDocumentInput extends ContractMutationActor {
  documentId: string
}
