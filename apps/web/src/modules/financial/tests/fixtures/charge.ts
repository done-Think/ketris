import type {
  ApiCharge,
  ApiChargeAuditEvent,
  ApiChargeListItem,
  FinancialSummary,
  ListChargesResponse,
} from '../../types/service'

export function apiCharge(overrides: Partial<ApiCharge> = {}): ApiCharge {
  return {
    id: 'charge-1',
    code: 'COB-2026-0001',
    type: 'RECEIVABLE',
    status: 'PENDING',
    amount: 2800,
    dueDate: '2026-10-10T00:00:00.000Z',
    description: 'Aluguel outubro',
    paymentMethod: null,
    paidAt: null,
    cancelledAt: null,
    cancellationReason: null,
    receipt: null,
    createdAt: '2026-10-01T12:00:00.000Z',
    updatedAt: '2026-10-01T12:00:00.000Z',
    contractId: 'contract-1',
    contractCode: 'CTR-2026-0001',
    propertyId: 'property-1',
    propertyTitle: 'Studio Pinheiros',
    propertyAddress: 'Rua dos Pinheiros, 100',
    payerName: 'Mariana Souza',
    payerEmail: 'mariana@example.com',
    ...overrides,
  }
}

export function apiListItem(overrides: Partial<ApiChargeListItem> = {}): ApiChargeListItem {
  return {
    id: 'charge-1',
    code: 'COB-2026-0001',
    type: 'RECEIVABLE',
    status: 'PENDING',
    amount: 2800,
    dueDate: '2026-10-10T00:00:00.000Z',
    description: 'Aluguel outubro',
    contractId: 'contract-1',
    payerName: 'Mariana Souza',
    propertyTitle: 'Studio Pinheiros',
    updatedAt: '2026-10-01T12:00:00.000Z',
    ...overrides,
  }
}

export function listResponse(
  items: ApiChargeListItem[],
  totalCount = items.length,
): ListChargesResponse {
  return {
    items,
    totalCount,
    statusCounts: { ALL: totalCount, PENDING: 0, OVERDUE: 0, PAID: 0, SCHEDULED: 0, CANCELED: 0 },
  }
}

export function auditEvent(overrides: Partial<ApiChargeAuditEvent> = {}): ApiChargeAuditEvent {
  return {
    id: 'event-1',
    action: 'CREATED',
    actorType: 'USER',
    actorName: 'Ana Dona',
    changedFields: [],
    fromStatus: null,
    toStatus: 'PENDING',
    reason: null,
    receipt: null,
    createdAt: '2026-10-01T12:00:00.000Z',
    ...overrides,
  }
}

export function summary(overrides: Partial<FinancialSummary> = {}): FinancialSummary {
  return {
    monthlyReceivable: 10500.5,
    overdueTotal: 2500,
    defaultRatePercentage: 12.5,
    occupancyRatePercentage: 64,
    monthlySeries: [
      { year: 2026, month: 9, total: 8000 },
      { year: 2026, month: 10, total: 10500.5 },
    ],
    upcomingDues: [],
    ...overrides,
  }
}
