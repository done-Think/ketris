export interface FinancialFixtureInput {
  suffix: string
  password: string
}

export interface FinancialFixtureResult {
  tenantIds: string[]
  ownerEmail: string
  renterEmail: string
  overdueChargeId: string
  overdueChargeCode: string
  scheduledChargeCode: string
  payableChargeCode: string
  propertyTitle: string
}

export interface FinancialEvidence {
  status: string
  paidById: string | null
  cancellationReason: string | null
  receiptCount: number
  auditActions: string[]
}
