import type {
  EditContractPayload,
  ContractHistoryPage,
  ContractOpportunityFilters,
  ContractOpportunitiesPage,
  SignContractPartyPayload,
  ContractPartyUserLink,
} from '../types/service'
import { BaseService } from '@shared/lib/api/base-service'
import type {
  ApiContract,
  ContractListFilters,
  ContractResponse,
  CreateContractPayload,
  ListContractsResponse,
} from '../types/service'

export class ContractsService extends BaseService {
  private readonly path = '/contracts'

  list(filters: ContractListFilters = {}): Promise<ListContractsResponse> {
    const params = Object.fromEntries(
      Object.entries(filters)
        .filter(([, value]) => value !== undefined && value !== '')
        .map(([key, value]) => [key, String(value)]),
    )

    return this.http.get<ListContractsResponse>(this.path, { params })
  }

  get(id: string): Promise<ApiContract> {
    return this.http.get<ContractResponse>(`${this.path}/${id}`).then((data) => data.contract)
  }

  create(payload: CreateContractPayload): Promise<ApiContract> {
    return this.http.post<ContractResponse>(this.path, payload).then((data) => data.contract)
  }

  signParty(
    contractId: string,
    partyId: string,
    payload: SignContractPartyPayload,
  ): Promise<ApiContract> {
    return this.http
      .post<ContractResponse>(`${this.path}/${contractId}/parties/${partyId}/sign`, payload)
      .then((data) => data.contract)
  }
  edit(id: string, payload: EditContractPayload): Promise<ApiContract> {
    return this.http
      .patch<ContractResponse>(this.path + '/' + id, payload)
      .then((data) => data.contract)
  }

  transition(id: string, action: 'cancel' | 'close', reason: string): Promise<ApiContract> {
    return this.http
      .post<ContractResponse>(this.path + '/' + id + '/' + action, { reason })
      .then((data) => data.contract)
  }

  history(id: string, page: number, pageSize = 10): Promise<ContractHistoryPage> {
    return this.http.get(this.path + '/' + id + '/history', { params: { page, pageSize } })
  }

  opportunities(filters: ContractOpportunityFilters): Promise<ContractOpportunitiesPage> {
    return this.http.get(this.path + '/opportunities', { params: filters })
  }

  linkParty(id: string, partyId: string, email: string): Promise<ContractPartyUserLink> {
    return this.http.post(this.path + '/' + id + '/parties/' + partyId + '/link-user', { email })
  }
}

export const contractsService = new ContractsService()
