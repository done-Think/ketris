import type { ApiContract, ApiContractDocument, ApiContractParty } from './service'
import type { z } from 'zod'
import type { createContractDocumentSchema } from '../schemas/contract-document-schema'

export type ContractDocumentForm = z.infer<ReturnType<typeof createContractDocumentSchema>>
export interface ContractDocumentUploadProps {
  contractId: string
  tenantId: string
  onBusyChange: (busy: boolean) => void
}
export interface ContractManualSignatureDialogProps {
  party: ApiContractParty
  documents: ApiContractDocument[]
  dataRevision: number
  pending: boolean
  error: unknown
  onClose: () => void
  onConfirm: (documentId: string) => void
}
export interface ContractTransitionDialogProps {
  action: 'cancel' | 'close'
  pending: boolean
  error: unknown
  onClose: () => void
  onConfirm: (reason: string) => void
}
export interface ContractEditDialogProps {
  contract: ApiContract
  tenantId: string
  onClose: () => void
}
export interface ContractHistoryPanelProps {
  tenantId: string
  contractId: string
}
export interface ContractSignMutationInput {
  partyId: string
  documentId: string
}
export interface ContractTransitionMutationInput {
  action: 'cancel' | 'close'
  reason: string
}
export interface ContractLinkMutationInput {
  partyId: string
  email: string
}
