import { BaseService } from '@shared/lib/api/base-service'

import type {
  ApiCharge,
  ChargeListFilters,
  ChargeResponse,
  CreateChargePayload,
  FinancialSummary,
  ListChargesResponse,
  RegisterChargePaymentPayload,
  UpdateChargePayload,
} from '../types/service'

export class FinancialService extends BaseService {
  private readonly path = '/financial'

  listCharges(filters: ChargeListFilters = {}): Promise<ListChargesResponse> {
    const params = {
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.search ? { search: filters.search } : {}),
      ...(filters.page ? { page: String(filters.page) } : {}),
      ...(filters.pageSize ? { pageSize: String(filters.pageSize) } : {}),
    }

    return this.http.get<ListChargesResponse>(`${this.path}/charges`, { params })
  }

  getCharge(id: string): Promise<ApiCharge> {
    return this.http.get<ChargeResponse>(`${this.path}/charges/${id}`).then((data) => data.charge)
  }

  createCharge(payload: CreateChargePayload): Promise<ApiCharge> {
    return this.http
      .post<ChargeResponse>(`${this.path}/charges`, payload)
      .then((data) => data.charge)
  }

  updateCharge(id: string, payload: UpdateChargePayload): Promise<ApiCharge> {
    return this.http
      .patch<ChargeResponse>(`${this.path}/charges/${id}`, payload)
      .then((data) => data.charge)
  }

  registerPayment(id: string, payload: RegisterChargePaymentPayload): Promise<ApiCharge> {
    return this.http
      .post<ChargeResponse>(`${this.path}/charges/${id}/payment`, payload)
      .then((data) => data.charge)
  }

  getSummary(): Promise<FinancialSummary> {
    return this.http.get<FinancialSummary>(`${this.path}/summary`)
  }
}

export const financialService = new FinancialService()
