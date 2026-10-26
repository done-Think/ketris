import type { Papel } from '@server/auth/domain/user.entity'
import type { ContractManageScope, NewContractParty } from './contract-entity'
import type {
  AdjustmentIndex,
  ContractGuaranteeType,
  ContractType,
  ContractStatus,
} from './contract'
import type { ContractAuditAction } from './audit'
import type { ContractActor } from './contract-entity'

export interface ContractEditableState {
  status: ContractStatus
  parties: { signatureStatus: 'PENDENTE' | 'ASSINADA' }[]
}

export interface ContractWorkflowScope extends ContractManageScope {
  tenantId: string
  actorId: string
}

export interface ContractMutationActor {
  actorTenantId: string
  actorId: string
  actorPapel: Papel
  contractId: string
}

export interface ContractEditData {
  type: ContractType
  amount: number
  dueDay: number
  startDate: Date
  endDate: Date
  adjustmentIndex: AdjustmentIndex
  guaranteeType: ContractGuaranteeType
  notes: string | null
  parties: NewContractParty[]
}

export interface EditContractInput extends ContractMutationActor {
  data: ContractEditData
}

export interface ContractTransition {
  action: 'CANCEL' | 'CLOSE'
  reason: string
}

export interface TransitionContractInput extends ContractMutationActor, ContractTransition {}

export interface ContractManualSignatureEvidence {
  documentId: string
  clientIp: string | null
  userAgent: string | null
}

export interface ContractHistoryEntry {
  id: string
  action: ContractAuditAction
  actor: ContractActor | null
  actorType: 'USER' | 'SYSTEM'
  changedFields: string[]
  fromStatus: ContractStatus | null
  toStatus: ContractStatus | null
  reason: string | null
  documentId: string | null
  createdAt: Date
}

export interface ContractHistoryPage {
  items: ContractHistoryEntry[]
  totalCount: number
  page: number
  pageSize: number
}

export interface ListContractHistoryInput extends ContractMutationActor {
  page: number
  pageSize: number
}
