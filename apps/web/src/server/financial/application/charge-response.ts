import type {
  Charge,
  ChargeAuditEvent,
  ChargeListItem,
  ChargeListResult,
  ChargeReceipt,
  FinancialSummary,
} from '../types/charge-entity'

function receiptResponse(receipt: ChargeReceipt | null) {
  return receipt
    ? {
        id: receipt.id,
        name: receipt.name,
        contentType: receipt.contentType,
        size: receipt.size,
        uploadedAt: receipt.uploadedAt.toISOString(),
      }
    : null
}

export function toChargeResponse(charge: Charge) {
  return {
    id: charge.id,
    code: charge.code,
    type: charge.type,
    status: charge.status,
    amount: charge.amount,
    dueDate: charge.dueDate.toISOString(),
    description: charge.description,
    paymentMethod: charge.paymentMethod,
    paidAt: charge.paidAt?.toISOString() ?? null,
    cancelledAt: charge.cancelledAt?.toISOString() ?? null,
    cancellationReason: charge.cancellationReason,
    receipt: receiptResponse(charge.receipt),
    createdAt: charge.createdAt.toISOString(),
    updatedAt: charge.updatedAt.toISOString(),
    contractId: charge.contractId,
    contractCode: charge.contractCode,
    propertyId: charge.propertyId,
    propertyTitle: charge.propertyTitle,
    propertyAddress: charge.propertyAddress,
    payerName: charge.payerName,
    payerEmail: charge.payerEmail,
  }
}

export function toChargeListResponse(result: ChargeListResult<ChargeListItem>) {
  return {
    items: result.items.map((item) => ({
      id: item.id,
      code: item.code,
      type: item.type,
      status: item.status,
      amount: item.amount,
      dueDate: item.dueDate.toISOString(),
      description: item.description,
      contractId: item.contractId,
      payerName: item.payerName,
      propertyTitle: item.propertyTitle,
      updatedAt: item.updatedAt.toISOString(),
    })),
    totalCount: result.totalCount,
    statusCounts: result.statusCounts,
  }
}

export function toChargeHistoryResponse(events: ChargeAuditEvent[]) {
  return {
    events: events.map((event) => ({
      ...event,
      receipt: receiptResponse(event.receipt),
      createdAt: event.createdAt.toISOString(),
    })),
  }
}

export function toFinancialSummaryResponse(summary: FinancialSummary) {
  return {
    monthlyReceivable: summary.monthlyReceivable,
    overdueTotal: summary.overdueTotal,
    defaultRatePercentage: summary.defaultRatePercentage,
    occupancyRatePercentage: summary.occupancyRatePercentage,
    monthlySeries: summary.monthlySeries,
    upcomingDues: summary.upcomingDues.map((due) => ({
      id: due.id,
      code: due.code,
      description: due.description,
      payerName: due.payerName,
      propertyId: due.propertyId,
      propertyTitle: due.propertyTitle,
      dueDate: due.dueDate.toISOString(),
      amount: due.amount,
      status: due.status,
    })),
  }
}
