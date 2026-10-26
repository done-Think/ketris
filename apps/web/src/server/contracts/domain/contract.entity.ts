import type {
  ContractActor,
  ContractParty,
  ContractDocument,
  ContractPropertySummary,
} from '../types/contract-entity'
import type {
  AdjustmentIndex,
  ContractGuaranteeType,
  ContractStatus,
  ContractType,
} from '../types/contract'

export interface Contract {
  id: string
  tenantId: string
  propertyId: string
  property: ContractPropertySummary
  opportunityId: string
  code: string
  type: ContractType
  amount: number
  dueDay: number
  startDate: Date
  endDate: Date
  adjustmentIndex: AdjustmentIndex
  guaranteeType: ContractGuaranteeType
  notes: string | null
  status: ContractStatus
  activatedAt: Date | null
  activatedBy: ContractActor | null
  createdAt: Date
  updatedAt: Date
  dataRevision: number
  createdBy: ContractActor | null
  cancelledAt: Date | null
  cancelledBy: ContractActor | null
  cancellationReason: string | null
  closedAt: Date | null
  closedBy: ContractActor | null
  closingReason: string | null
  parties: ContractParty[]
  documents: ContractDocument[]
}
