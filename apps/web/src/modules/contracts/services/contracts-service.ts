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
    const params = {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.propertyId ? { propertyId: filters.propertyId } : {}),
      ...(filters.search ? { search: filters.search } : {}),
      ...(filters.page ? { page: String(filters.page) } : {}),
      ...(filters.pageSize ? { pageSize: String(filters.pageSize) } : {}),
    }

    return this.http.get<ListContractsResponse>(this.path, { params })
  }

  get(id: string): Promise<ApiContract> {
    return this.http.get<ContractResponse>(`${this.path}/${id}`).then((data) => data.contract)
  }

  create(payload: CreateContractPayload): Promise<ApiContract> {
    return this.http.post<ContractResponse>(this.path, payload).then((data) => data.contract)
  }

  signParty(contractId: string, partyId: string): Promise<ApiContract> {
    return this.http
      .post<ContractResponse>(`${this.path}/${contractId}/parties/${partyId}/sign`)
      .then((data) => data.contract)
  }
}

export const contractsService = new ContractsService()
