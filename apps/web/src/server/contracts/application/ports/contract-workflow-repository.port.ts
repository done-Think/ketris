import type { Contract } from '../../domain/contract.entity'
import type { ContractReadScope } from '../../types/contract-entity'
import type {
  ContractEditData,
  ContractHistoryPage,
  ContractManualSignatureEvidence,
  ContractTransition,
  ContractWorkflowScope,
} from '../../types/workflow'

export interface ContractWorkflowRepository {
  edit(contractId: string, scope: ContractWorkflowScope, data: ContractEditData): Promise<Contract>
  transition(
    contractId: string,
    scope: ContractWorkflowScope,
    transition: ContractTransition,
  ): Promise<Contract>
  signParty(
    contractId: string,
    partyId: string,
    scope: ContractWorkflowScope,
    evidence: ContractManualSignatureEvidence,
  ): Promise<Contract>
  history(
    contractId: string,
    scope: ContractReadScope,
    page: number,
    pageSize: number,
  ): Promise<ContractHistoryPage>
}
