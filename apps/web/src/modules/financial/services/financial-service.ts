import { BaseService } from '@shared/lib/api/base-service'
import { HttpClient, httpClient } from '@shared/lib/api/http-client'
import { uploadToSignedUrl } from '@shared/lib/api/signed-upload'
import { sha256Hex } from '@shared/utils/sha256-hex'

import type {
  ApiCharge,
  ChargeHistoryResponse,
  ChargeListFilters,
  ChargeReasonPayload,
  ChargeReceiptDownload,
  ChargeReceiptUploadAuthorization,
  ChargeResponse,
  CreateChargePayload,
  FinancialSummary,
  ListChargesResponse,
  RegisterChargePaymentPayload,
  UpdateChargePayload,
} from '../types/service'

export class FinancialService extends BaseService {
  private readonly path = '/financial'

  constructor(
    client: HttpClient = httpClient,
    private readonly storage = new HttpClient(''),
  ) {
    super(client)
  }

  listCharges(filters: ChargeListFilters = {}): Promise<ListChargesResponse> {
    const params = Object.fromEntries(
      Object.entries(filters)
        .filter(([, value]) => value !== undefined && value !== '')
        .map(([key, value]) => [key, String(value)]),
    )

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

  deleteCharge(id: string): Promise<void> {
    return this.http.delete<void>(`${this.path}/charges/${id}`)
  }

  cancelCharge(id: string, payload: ChargeReasonPayload): Promise<ApiCharge> {
    return this.http
      .post<ChargeResponse>(`${this.path}/charges/${id}/cancel`, payload)
      .then((data) => data.charge)
  }

  reversePayment(id: string, payload: ChargeReasonPayload): Promise<ApiCharge> {
    return this.http
      .post<ChargeResponse>(`${this.path}/charges/${id}/payment-reversal`, payload)
      .then((data) => data.charge)
  }

  async uploadReceipt(id: string, file: File): Promise<string> {
    const authorization = await this.http.post<ChargeReceiptUploadAuthorization>(
      `${this.path}/charges/${id}/receipt-uploads`,
      { name: file.name, contentType: file.type, size: file.size, sha256: await sha256Hex(file) },
    )
    await uploadToSignedUrl(
      this.storage,
      { url: authorization.uploadUrl, headers: authorization.headers },
      file,
    )

    return authorization.uploadToken
  }

  registerPayment(id: string, payload: RegisterChargePaymentPayload): Promise<ApiCharge> {
    return this.http
      .post<ChargeResponse>(`${this.path}/charges/${id}/payment`, payload)
      .then((data) => data.charge)
  }

  getHistory(id: string): Promise<ChargeHistoryResponse> {
    return this.http.get<ChargeHistoryResponse>(`${this.path}/charges/${id}/history`)
  }

  downloadReceipt(id: string, receiptId: string): Promise<ChargeReceiptDownload> {
    return this.http.get<ChargeReceiptDownload>(
      `${this.path}/charges/${id}/receipts/${receiptId}/download`,
    )
  }

  exportCharges(month: string, locale: string): Promise<Blob> {
    return this.http.get<Blob>(`${this.path}/charges/export`, {
      params: { month, locale },
      responseType: 'blob',
    })
  }

  getSummary(month?: string): Promise<FinancialSummary> {
    return this.http.get<FinancialSummary>(`${this.path}/summary`, {
      params: month ? { month } : undefined,
    })
  }
}

export const financialService = new FinancialService()
