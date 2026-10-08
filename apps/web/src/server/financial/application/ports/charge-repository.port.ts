import type {
  Charge,
  ChargeListFilters,
  ChargeListResult,
  ChargePaymentData,
  ChargeUpdateData,
  FinancialSummary,
  NewCharge,
} from '../../domain/charge.entity'

export interface ChargeRepository {
  findContractSummary(tenantId: string, contractId: string): Promise<{ id: string } | null>
  create(input: NewCharge): Promise<Charge>
  findMany(filters: ChargeListFilters): Promise<ChargeListResult>
  findById(tenantId: string, chargeId: string): Promise<Charge | null>
  update(tenantId: string, chargeId: string, patch: ChargeUpdateData): Promise<Charge>
  registerPayment(tenantId: string, chargeId: string, payment: ChargePaymentData): Promise<Charge>
  getSummary(tenantId: string, referenceDate: Date): Promise<FinancialSummary>
}
