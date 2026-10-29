import type { Prisma } from '@prisma/client'

import { prisma } from '@server/db/prisma'
import { calendarMonthDateRange } from '@server/shared/time-zone-calendar'
import type { CalendarMonth } from '@server/shared/types/time-zone-calendar'

import type { ChargeRepository } from '../application/ports/charge-repository.port'
import { ChargeConcurrentChangeError } from '../domain/errors'
import type {
  ChargeAuditEvent,
  ChargeChanges,
  ChargeListFilters,
  ChargeListResult,
  ChargeMutationActor,
  ChargePaymentData,
  ChargeStatusCounts,
  FinancialMonthlyTotal,
  FinancialSummaryTotals,
  NewCharge,
  StoredCharge,
  StoredChargeListItem,
} from '../types/charge-entity'
import type { ChargeEditableField, ChargeStatus } from '../types/charge'
import type { StoredChargeReceiptFile } from '../types/charge-receipt'
import type { ChargeReadScope } from '../types/charge-read-scope'
import type { ChargeWithRelations } from '../types/prisma-charge-repository'
import { insertCharge, recordChargeAudit } from './charge-writes'

const openStatuses = ['PENDING', 'SCHEDULED'] as const
const countedStatuses = [undefined, 'PENDING', 'OVERDUE', 'PAID', 'SCHEDULED', 'CANCELED'] as const

const receiptSelect = {
  id: true,
  fileName: true,
  contentType: true,
  sizeBytes: true,
  createdAt: true,
} as const

const chargeInclude = {
  currentReceipt: { select: receiptSelect },
  contract: {
    include: {
      property: {
        select: {
          id: true,
          title: true,
          address: { select: { street: true, neighborhood: true, city: true } },
        },
      },
      parties: { where: { role: 'RENTER' as const }, select: { name: true, email: true } },
    },
  },
} as const

const fieldColumns: Record<ChargeEditableField, string> = {
  description: 'description',
  type: 'type',
  amount: 'amount',
  dueDate: 'dueDate',
}

function buildPropertyAddress(
  address: { street: string; neighborhood: string; city: string } | null,
): string | null {
  if (!address) return null

  const parts = [address.street, address.neighborhood, address.city].filter(Boolean)

  return parts.length > 0 ? parts.join(', ') : null
}

function toStoredCharge(charge: ChargeWithRelations): StoredCharge {
  const payer = charge.contract?.parties[0] ?? null
  const receipt = charge.currentReceipt

  return {
    id: charge.id,
    tenantId: charge.tenantId,
    code: charge.code,
    type: charge.type,
    storedStatus: charge.status,
    amount: charge.amount.toNumber(),
    dueDate: charge.dueDate,
    description: charge.description,
    paymentMethod: charge.paymentMethod,
    paidAt: charge.paidAt,
    paidById: charge.paidById,
    cancelledAt: charge.canceledAt,
    cancellationReason: charge.cancellationReason,
    receipt: receipt
      ? {
          id: receipt.id,
          name: receipt.fileName,
          contentType: receipt.contentType,
          size: receipt.sizeBytes,
          uploadedAt: receipt.createdAt,
        }
      : null,
    createdAt: charge.createdAt,
    updatedAt: charge.updatedAt,
    contractId: charge.contractId,
    contractCode: charge.contract?.code ?? null,
    propertyId: charge.contract?.property.id ?? null,
    propertyTitle: charge.contract?.property.title ?? null,
    propertyAddress: charge.contract
      ? buildPropertyAddress(charge.contract.property.address)
      : null,
    payerName: payer?.name ?? null,
    payerEmail: payer?.email ?? null,
  }
}

function monthRange(month: CalendarMonth, monthsBack: number) {
  return {
    start: calendarMonthDateRange(month, -monthsBack).start,
    end: calendarMonthDateRange(month).end,
  }
}

function chargeReadWhere(scope: ChargeReadScope): Prisma.ChargeWhereInput {
  if (scope.kind === 'renter') {
    return {
      type: 'RECEIVABLE',
      contract: {
        parties: {
          some: {
            role: 'RENTER',
            userId: scope.userId,
            user: { active: true, role: 'RENTER' },
          },
        },
      },
    }
  }

  if (scope.kind === 'propertyOwner') {
    return { tenantId: scope.tenantId, contract: { property: { ownerId: scope.ownerId } } }
  }

  return { tenantId: scope.tenantId }
}

function statusWhere(status: ChargeStatus | undefined, today: Date): Prisma.ChargeWhereInput {
  if (!status) return {}
  if (status === 'OVERDUE') return { status: { in: [...openStatuses] }, dueDate: { lt: today } }
  if (status === 'PENDING' || status === 'SCHEDULED') return { status, dueDate: { gte: today } }
  return { status }
}

function searchWhere(search: string | undefined): Prisma.ChargeWhereInput {
  if (!search) return {}

  return {
    OR: [
      { code: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { contract: { property: { title: { contains: search, mode: 'insensitive' } } } },
      {
        contract: {
          parties: {
            some: { role: 'RENTER', name: { contains: search, mode: 'insensitive' } },
          },
        },
      },
    ],
  }
}

function snapshotOf(charge: StoredCharge): Prisma.InputJsonValue {
  return {
    code: charge.code,
    type: charge.type,
    status: charge.storedStatus,
    amount: charge.amount,
    dueDate: charge.dueDate.toISOString(),
    description: charge.description,
    contractId: charge.contractId,
  }
}

async function guardedUpdate(
  tx: Prisma.TransactionClient,
  current: StoredCharge,
  data: Prisma.ChargeUncheckedUpdateManyInput,
): Promise<void> {
  const result = await tx.charge.updateMany({
    where: {
      id: current.id,
      tenantId: current.tenantId,
      status: current.storedStatus,
      updatedAt: current.updatedAt,
    },
    data,
  })
  if (result.count !== 1) throw new ChargeConcurrentChangeError()
}

export class PrismaChargeRepository implements ChargeRepository {
  async findContractSummary(tenantId: string, contractId: string): Promise<{ id: string } | null> {
    return prisma.contract.findFirst({ where: { tenantId, id: contractId }, select: { id: true } })
  }

  async create(input: NewCharge, actor: ChargeMutationActor): Promise<StoredCharge> {
    const created = await prisma.$transaction((tx) =>
      insertCharge(tx, {
        tenantId: input.tenantId,
        contractId: input.contractId,
        description: input.description,
        type: input.type,
        amount: input.amount,
        dueDate: input.dueDate,
        status: input.status,
        createdById: actor.actorId,
      }),
    )

    return this.require(input.tenantId, created.id)
  }

  async findMany(filters: ChargeListFilters): Promise<ChargeListResult<StoredChargeListItem>> {
    const page = filters.page && filters.page > 0 ? Math.floor(filters.page) : 1
    const pageSize = filters.pageSize && filters.pageSize > 0 ? Math.floor(filters.pageSize) : 10
    const base: Prisma.ChargeWhereInput[] = [
      chargeReadWhere(filters.scope),
      searchWhere(filters.search?.trim()),
      filters.type ? { type: filters.type } : {},
      filters.dueMonth
        ? {
            dueDate: {
              gte: calendarMonthDateRange(filters.dueMonth).start,
              lt: calendarMonthDateRange(filters.dueMonth).end,
            },
          }
        : {},
    ]
    const where: Prisma.ChargeWhereInput = {
      AND: [...base, statusWhere(filters.status, filters.today)],
    }
    const countFor = (status?: ChargeStatus) =>
      prisma.charge.count({ where: { AND: [...base, statusWhere(status, filters.today)] } })

    const [charges, totalCount, ...counts] = await Promise.all([
      prisma.charge.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
        include: chargeInclude,
      }),
      prisma.charge.count({ where }),
      ...countedStatuses.map((status) => countFor(status)),
    ])
    const statusCounts = Object.fromEntries(
      countedStatuses.map((status, index) => [status ?? 'ALL', counts[index]]),
    ) as ChargeStatusCounts

    return {
      items: charges.map((row) => {
        const charge = toStoredCharge(row)

        return {
          id: charge.id,
          code: charge.code,
          type: charge.type,
          storedStatus: charge.storedStatus,
          amount: charge.amount,
          dueDate: charge.dueDate,
          description: charge.description,
          contractId: charge.contractId,
          payerName: charge.payerName,
          propertyTitle: charge.propertyTitle,
          updatedAt: charge.updatedAt,
        }
      }),
      totalCount,
      statusCounts,
    }
  }

  async findForExport(tenantId: string, month: CalendarMonth): Promise<StoredCharge[]> {
    const range = calendarMonthDateRange(month)
    const rows = await prisma.charge.findMany({
      where: { tenantId, dueDate: { gte: range.start, lt: range.end } },
      orderBy: [{ dueDate: 'asc' }, { code: 'asc' }],
      include: chargeInclude,
    })

    return rows.map(toStoredCharge)
  }

  findById(tenantId: string, chargeId: string): Promise<StoredCharge | null> {
    return this.findReadableById({ kind: 'tenant', tenantId }, chargeId)
  }

  async findReadableById(scope: ChargeReadScope, chargeId: string): Promise<StoredCharge | null> {
    const charge = await prisma.charge.findFirst({
      where: { ...chargeReadWhere(scope), id: chargeId },
      include: chargeInclude,
    })

    return charge ? toStoredCharge(charge) : null
  }

  async hasMovement(tenantId: string, chargeId: string): Promise<boolean> {
    const [events, receipts] = await Promise.all([
      prisma.chargeAuditEvent.count({
        where: {
          tenantId,
          chargeId,
          action: { in: ['PAYMENT_REGISTERED', 'PAYMENT_REVERSED', 'CANCELLED'] },
        },
      }),
      prisma.chargeReceipt.count({ where: { tenantId, chargeId: chargeId } }),
    ])

    return events > 0 || receipts > 0
  }

  async update(
    current: StoredCharge,
    changes: ChargeChanges,
    changedFields: ChargeEditableField[],
    actor: ChargeMutationActor,
  ): Promise<StoredCharge> {
    await prisma.$transaction(async (tx) => {
      await guardedUpdate(tx, current, {
        ...(changedFields.includes('description')
          ? { description: changes.description ?? null }
          : {}),
        ...(changedFields.includes('type') ? { type: changes.type } : {}),
        ...(changedFields.includes('amount') ? { amount: changes.amount } : {}),
        ...(changedFields.includes('dueDate') ? { dueDate: changes.dueDate } : {}),
      })
      await recordChargeAudit(tx, {
        tenantId: current.tenantId,
        chargeId: current.id,
        chargeCode: current.code,
        actorUserId: actor.actorId,
        action: 'UPDATED',
        changedFields: changedFields.map((field) => fieldColumns[field]),
        snapshot: snapshotOf(current),
      })
    })

    return this.require(current.tenantId, current.id)
  }

  async registerPayment(
    current: StoredCharge,
    payment: ChargePaymentData,
    actor: ChargeMutationActor,
  ): Promise<StoredCharge> {
    await prisma.$transaction(async (tx) => {
      const receipt = payment.receipt
        ? await tx.chargeReceipt.create({
            data: {
              id: payment.receipt.id,
              tenantId: current.tenantId,
              chargeId: current.id,
              objectKey: payment.receipt.objectKey,
              fileName: payment.receipt.name,
              contentType: payment.receipt.contentType,
              sizeBytes: payment.receipt.size,
              sha256: payment.receipt.sha256,
              uploadedById: actor.actorId,
            },
            select: { id: true },
          })
        : null
      await guardedUpdate(tx, current, {
        status: 'PAID',
        paidAt: payment.paidAt,
        paidById: actor.actorId,
        paymentMethod: payment.paymentMethod,
        currentReceiptId: receipt?.id ?? null,
      })
      await recordChargeAudit(tx, {
        tenantId: current.tenantId,
        chargeId: current.id,
        chargeCode: current.code,
        actorUserId: actor.actorId,
        action: 'PAYMENT_REGISTERED',
        fromStatus: current.storedStatus,
        toStatus: 'PAID',
        receiptId: receipt?.id ?? null,
        snapshot: {
          paidAt: payment.paidAt.toISOString(),
          paymentMethod: payment.paymentMethod,
        },
      })
    })

    return this.require(current.tenantId, current.id)
  }

  async reversePayment(
    current: StoredCharge,
    reason: string,
    actor: ChargeMutationActor,
  ): Promise<StoredCharge> {
    await prisma.$transaction(async (tx) => {
      await guardedUpdate(tx, current, {
        status: 'PENDING',
        paidAt: null,
        paidById: null,
        paymentMethod: null,
        currentReceiptId: null,
      })
      await recordChargeAudit(tx, {
        tenantId: current.tenantId,
        chargeId: current.id,
        chargeCode: current.code,
        actorUserId: actor.actorId,
        action: 'PAYMENT_REVERSED',
        fromStatus: 'PAID',
        toStatus: 'PENDING',
        reason,
        receiptId: current.receipt?.id ?? null,
        snapshot: {
          paidAt: current.paidAt?.toISOString() ?? null,
          paymentMethod: current.paymentMethod,
        },
      })
    })

    return this.require(current.tenantId, current.id)
  }

  async cancel(
    current: StoredCharge,
    reason: string,
    actor: ChargeMutationActor,
  ): Promise<StoredCharge> {
    await prisma.$transaction(async (tx) => {
      await guardedUpdate(tx, current, {
        status: 'CANCELED',
        canceledAt: new Date(),
        canceledById: actor.actorId,
        cancellationReason: reason,
      })
      await recordChargeAudit(tx, {
        tenantId: current.tenantId,
        chargeId: current.id,
        chargeCode: current.code,
        actorUserId: actor.actorId,
        action: 'CANCELLED',
        fromStatus: current.storedStatus,
        toStatus: 'CANCELED',
        reason,
      })
    })

    return this.require(current.tenantId, current.id)
  }

  async delete(current: StoredCharge, actor: ChargeMutationActor): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await recordChargeAudit(tx, {
        tenantId: current.tenantId,
        chargeId: current.id,
        chargeCode: current.code,
        actorUserId: actor.actorId,
        action: 'DELETED',
        fromStatus: current.storedStatus,
        snapshot: snapshotOf(current),
      })
      const result = await tx.charge.deleteMany({
        where: {
          id: current.id,
          tenantId: current.tenantId,
          status: current.storedStatus,
          updatedAt: current.updatedAt,
        },
      })
      if (result.count !== 1) throw new ChargeConcurrentChangeError()
    })
  }

  async listHistory(tenantId: string, chargeId: string): Promise<ChargeAuditEvent[]> {
    const rows = await prisma.chargeAuditEvent.findMany({
      where: { tenantId, chargeId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: { actor: { select: { name: true } } },
    })
    const receiptIds = rows.flatMap((row) => (row.receiptId ? [row.receiptId] : []))
    const receipts = receiptIds.length
      ? await prisma.chargeReceipt.findMany({
          where: { tenantId, chargeId: chargeId, id: { in: receiptIds } },
          select: receiptSelect,
        })
      : []
    const receiptById = new Map(receipts.map((receipt) => [receipt.id, receipt]))

    return rows.map((row) => {
      const receipt = row.receiptId ? receiptById.get(row.receiptId) : undefined

      return {
        id: row.id,
        action: row.action,
        actorType: row.actorType,
        actorName: row.actor?.name ?? null,
        changedFields: row.changedFields,
        fromStatus: row.fromStatus,
        toStatus: row.toStatus,
        reason: row.reason,
        receipt: receipt
          ? {
              id: receipt.id,
              name: receipt.fileName,
              contentType: receipt.contentType,
              size: receipt.sizeBytes,
              uploadedAt: receipt.createdAt,
            }
          : null,
        createdAt: row.createdAt,
      }
    })
  }

  async findReceipt(
    scope: ChargeReadScope,
    chargeId: string,
    receiptId: string,
    includeHistory: boolean,
  ): Promise<StoredChargeReceiptFile | null> {
    const receipt = await prisma.chargeReceipt.findFirst({
      where: {
        id: receiptId,
        chargeId: chargeId,
        charge: {
          ...chargeReadWhere(scope),
          ...(includeHistory ? {} : { currentReceiptId: receiptId }),
        },
      },
    })

    return receipt
      ? {
          id: receipt.id,
          tenantId: receipt.tenantId,
          chargeId: receipt.chargeId,
          objectKey: receipt.objectKey,
          name: receipt.fileName,
          contentType: receipt.contentType,
          size: receipt.sizeBytes,
          sha256: receipt.sha256,
        }
      : null
  }

  async getSummary(
    tenantId: string,
    month: CalendarMonth,
    today: Date,
  ): Promise<FinancialSummaryTotals> {
    const currentMonth = monthRange(month, 0)
    const receivable = {
      tenantId,
      type: 'RECEIVABLE' as const,
      status: { not: 'CANCELED' as const },
    }

    const [
      monthlyReceivableAggregate,
      overdueAggregate,
      totalReceivableAggregate,
      seriesRows,
      upcomingRows,
      rentedPropertiesCount,
      listedPropertiesCount,
    ] = await Promise.all([
      prisma.charge.aggregate({
        _sum: { amount: true },
        where: { ...receivable, dueDate: { gte: currentMonth.start, lt: currentMonth.end } },
      }),
      prisma.charge.aggregate({
        _sum: { amount: true },
        where: {
          tenantId,
          type: 'RECEIVABLE',
          status: { in: [...openStatuses] },
          dueDate: { lt: today },
        },
      }),
      prisma.charge.aggregate({ _sum: { amount: true }, where: receivable }),
      prisma.charge.findMany({
        where: {
          ...receivable,
          dueDate: { gte: monthRange(month, 5).start, lt: currentMonth.end },
        },
        select: { amount: true, dueDate: true },
      }),
      prisma.charge.findMany({
        where: { tenantId, type: 'RECEIVABLE', status: 'PENDING' },
        orderBy: [{ dueDate: 'asc' }, { id: 'asc' }],
        take: 5,
        include: chargeInclude,
      }),
      prisma.property.count({
        where: { tenantId, purpose: { in: ['RENT', 'BOTH'] }, status: 'RENTED' },
      }),
      prisma.property.count({
        where: {
          tenantId,
          purpose: { in: ['RENT', 'BOTH'] },
          status: { in: ['PUBLISHED', 'RENTED'] },
        },
      }),
    ])

    const monthlyReceivable = monthlyReceivableAggregate._sum.amount?.toNumber() ?? 0
    const overdueTotal = overdueAggregate._sum.amount?.toNumber() ?? 0
    const totalReceivable = totalReceivableAggregate._sum.amount?.toNumber() ?? 0
    const defaultRatePercentage = totalReceivable > 0 ? (overdueTotal / totalReceivable) * 100 : 0
    const occupancyRatePercentage =
      listedPropertiesCount > 0 ? (rentedPropertiesCount / listedPropertiesCount) * 100 : 0

    const monthlySeries: FinancialMonthlyTotal[] = Array.from({ length: 6 }, (_, index) => {
      const date = calendarMonthDateRange(month, index - 5).start
      return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, total: 0 }
    })

    for (const row of seriesRows) {
      const bucket = monthlySeries.find(
        (entry) =>
          entry.year === row.dueDate.getUTCFullYear() &&
          entry.month === row.dueDate.getUTCMonth() + 1,
      )
      if (bucket) bucket.total += row.amount.toNumber()
    }

    return {
      monthlyReceivable,
      overdueTotal,
      defaultRatePercentage,
      occupancyRatePercentage,
      monthlySeries,
      upcomingDues: upcomingRows.map((row) => {
        const charge = toStoredCharge(row)

        return {
          id: charge.id,
          code: charge.code,
          description: charge.description,
          payerName: charge.payerName,
          propertyId: charge.propertyId,
          propertyTitle: charge.propertyTitle,
          dueDate: charge.dueDate,
          amount: charge.amount,
          storedStatus: charge.storedStatus,
        }
      }),
    }
  }

  private async require(tenantId: string, chargeId: string): Promise<StoredCharge> {
    const charge = await this.findById(tenantId, chargeId)
    if (!charge) throw new ChargeConcurrentChangeError()
    return charge
  }
}
