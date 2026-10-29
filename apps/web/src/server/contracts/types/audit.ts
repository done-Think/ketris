export type ContractAuditAction =
  | 'CREATED'
  | 'UPDATED'
  | 'MANUAL_SIGNATURE_REGISTERED'
  | 'DOCUMENT_UPLOADED'
  | 'CANCELLED'
  | 'CLOSED'

export interface ContractAuditInput {
  tenantId: string
  contractId: string
  actorUserId?: string
  actorType?: 'USER' | 'SYSTEM'
  action: ContractAuditAction
  changedFields?: string[]
  fromStatus?: ContractStatus
  toStatus?: ContractStatus
  reason?: string
  documentId?: string
}
import type { ContractStatus } from './contract'
