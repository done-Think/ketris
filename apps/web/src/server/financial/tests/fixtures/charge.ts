import { vi } from 'vitest'

import type { ChargeRepository } from '../../application/ports/charge-repository.port'
import type {
  ChargeReceiptStorage,
  ChargeReceiptUploadTickets,
} from '../../application/ports/charge-receipt-storage.port'
import type { StoredCharge } from '../../types/charge-entity'
import type { ChargeReceiptDescriptor } from '../../types/charge-receipt'

export const now = new Date('2026-10-26T15:00:00.000Z')

export function storedCharge(overrides: Partial<StoredCharge> = {}): StoredCharge {
  return {
    id: 'charge-1',
    tenantId: 'tenant-1',
    code: 'COB-2026-0001',
    type: 'RECEIVABLE',
    storedStatus: 'PENDING',
    amount: 2500,
    dueDate: new Date('2026-11-05T00:00:00.000Z'),
    description: 'Aluguel avulso',
    paymentMethod: null,
    paidAt: null,
    paidById: null,
    cancelledAt: null,
    cancellationReason: null,
    receipt: null,
    createdAt: new Date('2026-09-29T00:00:00.000Z'),
    updatedAt: new Date('2026-09-29T00:00:00.000Z'),
    contractId: null,
    contractCode: null,
    propertyId: null,
    propertyTitle: null,
    propertyAddress: null,
    payerName: null,
    payerEmail: null,
    ...overrides,
  }
}

export function createRepository(overrides: Partial<ChargeRepository> = {}): ChargeRepository {
  const charge = storedCharge()

  return {
    findContractSummary: vi.fn().mockResolvedValue({ id: 'contract-1' }),
    create: vi.fn().mockResolvedValue(charge),
    findMany: vi.fn().mockResolvedValue({
      items: [],
      totalCount: 0,
      statusCounts: { ALL: 0, PENDING: 0, OVERDUE: 0, PAID: 0, SCHEDULED: 0, CANCELED: 0 },
    }),
    findById: vi.fn().mockResolvedValue(charge),
    findReadableById: vi.fn().mockResolvedValue(charge),
    hasMovement: vi.fn().mockResolvedValue(false),
    update: vi.fn().mockResolvedValue(charge),
    registerPayment: vi.fn().mockResolvedValue(storedCharge({ storedStatus: 'PAID' })),
    reversePayment: vi.fn().mockResolvedValue(charge),
    cancel: vi.fn().mockResolvedValue(storedCharge({ storedStatus: 'CANCELED' })),
    delete: vi.fn().mockResolvedValue(undefined),
    listHistory: vi.fn().mockResolvedValue([]),
    findReceipt: vi.fn().mockResolvedValue(null),
    findForExport: vi.fn().mockResolvedValue([]),
    getSummary: vi.fn().mockResolvedValue({
      monthlyReceivable: 0,
      overdueTotal: 0,
      defaultRatePercentage: 0,
      occupancyRatePercentage: 0,
      monthlySeries: [],
      upcomingDues: [],
    }),
    ...overrides,
  }
}

export const owner = { actorId: 'owner-1', actorTenantId: 'tenant-1', actorRole: 'OWNER' } as const

export const receiptDescriptor: ChargeReceiptDescriptor = {
  id: 'receipt-1',
  tenantId: 'tenant-1',
  chargeId: 'charge-1',
  actorId: 'owner-1',
  name: 'comprovante.pdf',
  contentType: 'application/pdf',
  size: 1200,
  sha256: 'a'.repeat(64),
}

export function createStorage(overrides: Partial<ChargeReceiptStorage> = {}): ChargeReceiptStorage {
  return {
    uploadLocation: vi.fn().mockResolvedValue({ url: 'https://s3/upload', headers: { a: 'b' } }),
    inspect: vi.fn().mockResolvedValue({
      size: 1200,
      contentType: 'application/pdf',
      sha256: 'a'.repeat(64),
      signature: new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]),
    }),
    downloadUrl: vi.fn().mockResolvedValue('https://s3/download'),
    ...overrides,
  }
}

export function createTickets(
  overrides: Partial<ChargeReceiptUploadTickets> = {},
): ChargeReceiptUploadTickets {
  return {
    issue: vi.fn().mockResolvedValue('upload-token'),
    verify: vi.fn().mockResolvedValue(receiptDescriptor),
    ...overrides,
  }
}
