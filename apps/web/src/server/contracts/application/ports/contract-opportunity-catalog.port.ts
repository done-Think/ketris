import type {
  ContractOpportunitiesPage,
  ContractOpportunitiesQuery,
} from '../../types/contract-opportunity'

export interface ContractOpportunityCatalog {
  list(query: ContractOpportunitiesQuery): Promise<ContractOpportunitiesPage>
}
