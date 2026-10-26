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
    type: 'A_RECEBER',
    status: 'PENDENTE',
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
    type: 'A_RECEBER',
    status: 'PENDENTE',
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
    statusCounts: { ALL: totalCount, PENDENTE: 0, ATRASADA: 0, PAGA: 0, AGENDADA: 0, CANCELADA: 0 },
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
    toStatus: 'PENDENTE',
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
