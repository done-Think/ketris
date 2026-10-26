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
import type { CobrancaWithRelations } from '../types/prisma-charge-repository'
import { insertCharge, recordChargeAudit } from './charge-writes'

const openStatuses = ['PENDENTE', 'AGENDADA'] as const
const countedStatuses = [
  undefined,
  'PENDENTE',
  'ATRASADA',
  'PAGA',
  'AGENDADA',
  'CANCELADA',
] as const

const receiptSelect = {
  id: true,
  nomeArquivo: true,
  tipoConteudo: true,
  tamanhoBytes: true,
  createdAt: true,
} as const

const chargeInclude = {
  comprovanteAtual: { select: receiptSelect },
  contrato: {
    include: {
      imovel: {
        select: {
          id: true,
          titulo: true,
          endereco: { select: { logradouro: true, bairro: true, cidade: true } },
        },
      },
      partes: { where: { papel: 'LOCATARIO' as const }, select: { nome: true, email: true } },
    },
  },
} as const

const fieldColumns: Record<ChargeEditableField, string> = {
  description: 'descricao',
  type: 'tipo',
  amount: 'valor',
  dueDate: 'vencimento',
}

function buildPropertyAddress(
  endereco: { logradouro: string; bairro: string; cidade: string } | null,
): string | null {
  if (!endereco) return null

  const parts = [endereco.logradouro, endereco.bairro, endereco.cidade].filter(Boolean)

  return parts.length > 0 ? parts.join(', ') : null
}

function toStoredCharge(cobranca: CobrancaWithRelations): StoredCharge {
  const payer = cobranca.contrato?.partes[0] ?? null
  const receipt = cobranca.comprovanteAtual

  return {
    id: cobranca.id,
    tenantId: cobranca.tenantId,
    code: cobranca.codigo,
    type: cobranca.tipo,
    storedStatus: cobranca.status,
    amount: cobranca.valor.toNumber(),
    dueDate: cobranca.vencimento,
    description: cobranca.descricao,
    paymentMethod: cobranca.formaPagamento,
    paidAt: cobranca.pagoEm,
    paidById: cobranca.pagoPorId,
    cancelledAt: cobranca.canceladoEm,
    cancellationReason: cobranca.motivoCancelamento,
    receipt: receipt
      ? {
          id: receipt.id,
          name: receipt.nomeArquivo,
          contentType: receipt.tipoConteudo,
          size: receipt.tamanhoBytes,
          uploadedAt: receipt.createdAt,
        }
      : null,
    createdAt: cobranca.createdAt,
    updatedAt: cobranca.updatedAt,
    contractId: cobranca.contratoId,
    contractCode: cobranca.contrato?.codigo ?? null,
    propertyId: cobranca.contrato?.imovel.id ?? null,
    propertyTitle: cobranca.contrato?.imovel.titulo ?? null,
    propertyAddress: cobranca.contrato
      ? buildPropertyAddress(cobranca.contrato.imovel.endereco)
      : null,
    payerName: payer?.nome ?? null,
    payerEmail: payer?.email ?? null,
  }
}

function monthRange(month: CalendarMonth, monthsBack: number) {
  return {
    start: calendarMonthDateRange(month, -monthsBack).start,
    end: calendarMonthDateRange(month).end,
  }
}

function chargeReadWhere(scope: ChargeReadScope): Prisma.CobrancaWhereInput {
  if (scope.kind === 'renter') {
    return {
      tipo: 'A_RECEBER',
      contrato: {
        partes: {
          some: {
            papel: 'LOCATARIO',
            usuarioId: scope.userId,
            usuario: { ativo: true, papel: 'RENTER' },
          },
        },
      },
    }
  }

  if (scope.kind === 'propertyOwner') {
    return { tenantId: scope.tenantId, contrato: { imovel: { proprietarioId: scope.ownerId } } }
  }

  return { tenantId: scope.tenantId }
}

function statusWhere(status: ChargeStatus | undefined, today: Date): Prisma.CobrancaWhereInput {
  if (!status) return {}
  if (status === 'ATRASADA') return { status: { in: [...openStatuses] }, vencimento: { lt: today } }
  if (status === 'PENDENTE' || status === 'AGENDADA') return { status, vencimento: { gte: today } }
  return { status }
}

function searchWhere(search: string | undefined): Prisma.CobrancaWhereInput {
  if (!search) return {}

  return {
    OR: [
      { codigo: { contains: search, mode: 'insensitive' } },
      { descricao: { contains: search, mode: 'insensitive' } },
      { contrato: { imovel: { titulo: { contains: search, mode: 'insensitive' } } } },
      {
        contrato: {
          partes: {
            some: { papel: 'LOCATARIO', nome: { contains: search, mode: 'insensitive' } },
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
  data: Prisma.CobrancaUncheckedUpdateManyInput,
): Promise<void> {
  const result = await tx.cobranca.updateMany({
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
    return prisma.contrato.findFirst({ where: { tenantId, id: contractId }, select: { id: true } })
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
    const base: Prisma.CobrancaWhereInput[] = [
      chargeReadWhere(filters.scope),
      searchWhere(filters.search?.trim()),
      filters.type ? { tipo: filters.type } : {},
      filters.dueMonth
        ? {
            vencimento: {
              gte: calendarMonthDateRange(filters.dueMonth).start,
              lt: calendarMonthDateRange(filters.dueMonth).end,
            },
          }
        : {},
    ]
    const where: Prisma.CobrancaWhereInput = {
      AND: [...base, statusWhere(filters.status, filters.today)],
    }
    const countFor = (status?: ChargeStatus) =>
      prisma.cobranca.count({ where: { AND: [...base, statusWhere(status, filters.today)] } })

    const [cobrancas, totalCount, ...counts] = await Promise.all([
      prisma.cobranca.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
        include: chargeInclude,
      }),
      prisma.cobranca.count({ where }),
      ...countedStatuses.map((status) => countFor(status)),
    ])
    const statusCounts = Object.fromEntries(
      countedStatuses.map((status, index) => [status ?? 'ALL', counts[index]]),
    ) as ChargeStatusCounts

    return {
      items: cobrancas.map((cobranca) => {
        const charge = toStoredCharge(cobranca)

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
    const rows = await prisma.cobranca.findMany({
      where: { tenantId, vencimento: { gte: range.start, lt: range.end } },
      orderBy: [{ vencimento: 'asc' }, { codigo: 'asc' }],
      include: chargeInclude,
    })

    return rows.map(toStoredCharge)
  }

  findById(tenantId: string, chargeId: string): Promise<StoredCharge | null> {
    return this.findReadableById({ kind: 'tenant', tenantId }, chargeId)
  }

  async findReadableById(scope: ChargeReadScope, chargeId: string): Promise<StoredCharge | null> {
    const cobranca = await prisma.cobranca.findFirst({
      where: { ...chargeReadWhere(scope), id: chargeId },
      include: chargeInclude,
    })

    return cobranca ? toStoredCharge(cobranca) : null
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
      prisma.comprovanteCobranca.count({ where: { tenantId, cobrancaId: chargeId } }),
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
          ? { descricao: changes.description ?? null }
          : {}),
        ...(changedFields.includes('type') ? { tipo: changes.type } : {}),
        ...(changedFields.includes('amount') ? { valor: changes.amount } : {}),
        ...(changedFields.includes('dueDate') ? { vencimento: changes.dueDate } : {}),
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
        ? await tx.comprovanteCobranca.create({
            data: {
              id: payment.receipt.id,
              tenantId: current.tenantId,
              cobrancaId: current.id,
              objectKey: payment.receipt.objectKey,
              nomeArquivo: payment.receipt.name,
              tipoConteudo: payment.receipt.contentType,
              tamanhoBytes: payment.receipt.size,
              sha256: payment.receipt.sha256,
              enviadoPorId: actor.actorId,
            },
            select: { id: true },
          })
        : null
      await guardedUpdate(tx, current, {
        status: 'PAGA',
        pagoEm: payment.paidAt,
        pagoPorId: actor.actorId,
        formaPagamento: payment.paymentMethod,
        comprovanteAtualId: receipt?.id ?? null,
      })
      await recordChargeAudit(tx, {
        tenantId: current.tenantId,
        chargeId: current.id,
        chargeCode: current.code,
        actorUserId: actor.actorId,
        action: 'PAYMENT_REGISTERED',
        fromStatus: current.storedStatus,
        toStatus: 'PAGA',
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
        status: 'PENDENTE',
        pagoEm: null,
        pagoPorId: null,
        formaPagamento: null,
        comprovanteAtualId: null,
      })
      await recordChargeAudit(tx, {
        tenantId: current.tenantId,
        chargeId: current.id,
        chargeCode: current.code,
        actorUserId: actor.actorId,
        action: 'PAYMENT_REVERSED',
        fromStatus: 'PAGA',
        toStatus: 'PENDENTE',
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
        status: 'CANCELADA',
        canceladoEm: new Date(),
        canceladoPorId: actor.actorId,
        motivoCancelamento: reason,
      })
      await recordChargeAudit(tx, {
        tenantId: current.tenantId,
        chargeId: current.id,
        chargeCode: current.code,
        actorUserId: actor.actorId,
        action: 'CANCELLED',
        fromStatus: current.storedStatus,
        toStatus: 'CANCELADA',
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
      const result = await tx.cobranca.deleteMany({
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
      include: { actor: { select: { nome: true } } },
    })
    const receiptIds = rows.flatMap((row) => (row.receiptId ? [row.receiptId] : []))
    const receipts = receiptIds.length
      ? await prisma.comprovanteCobranca.findMany({
          where: { tenantId, cobrancaId: chargeId, id: { in: receiptIds } },
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
        actorName: row.actor?.nome ?? null,
        changedFields: row.changedFields,
        fromStatus: row.fromStatus,
        toStatus: row.toStatus,
        reason: row.reason,
        receipt: receipt
          ? {
              id: receipt.id,
              name: receipt.nomeArquivo,
              contentType: receipt.tipoConteudo,
              size: receipt.tamanhoBytes,
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
    const receipt = await prisma.comprovanteCobranca.findFirst({
      where: {
        id: receiptId,
        cobrancaId: chargeId,
        cobranca: {
          ...chargeReadWhere(scope),
          ...(includeHistory ? {} : { comprovanteAtualId: receiptId }),
        },
      },
    })

    return receipt
      ? {
          id: receipt.id,
          tenantId: receipt.tenantId,
          chargeId: receipt.cobrancaId,
          objectKey: receipt.objectKey,
          name: receipt.nomeArquivo,
          contentType: receipt.tipoConteudo,
          size: receipt.tamanhoBytes,
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
      tipo: 'A_RECEBER' as const,
      status: { not: 'CANCELADA' as const },
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
      prisma.cobranca.aggregate({
        _sum: { valor: true },
        where: { ...receivable, vencimento: { gte: currentMonth.start, lt: currentMonth.end } },
      }),
      prisma.cobranca.aggregate({
        _sum: { valor: true },
        where: {
          tenantId,
          tipo: 'A_RECEBER',
          status: { in: [...openStatuses] },
          vencimento: { lt: today },
        },
      }),
      prisma.cobranca.aggregate({ _sum: { valor: true }, where: receivable }),
      prisma.cobranca.findMany({
        where: {
          ...receivable,
          vencimento: { gte: monthRange(month, 5).start, lt: currentMonth.end },
        },
        select: { valor: true, vencimento: true },
      }),
      prisma.cobranca.findMany({
        where: { tenantId, tipo: 'A_RECEBER', status: 'PENDENTE' },
        orderBy: [{ vencimento: 'asc' }, { id: 'asc' }],
        take: 5,
        include: chargeInclude,
      }),
      prisma.imovel.count({
        where: { tenantId, finalidade: { in: ['ALUGUEL', 'AMBOS'] }, status: 'RENTED' },
      }),
      prisma.imovel.count({
        where: {
          tenantId,
          finalidade: { in: ['ALUGUEL', 'AMBOS'] },
          status: { in: ['PUBLISHED', 'RENTED'] },
        },
      }),
    ])

    const monthlyReceivable = monthlyReceivableAggregate._sum.valor?.toNumber() ?? 0
    const overdueTotal = overdueAggregate._sum.valor?.toNumber() ?? 0
    const totalReceivable = totalReceivableAggregate._sum.valor?.toNumber() ?? 0
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
          entry.year === row.vencimento.getUTCFullYear() &&
          entry.month === row.vencimento.getUTCMonth() + 1,
      )
      if (bucket) bucket.total += row.valor.toNumber()
    }

    return {
      monthlyReceivable,
      overdueTotal,
      defaultRatePercentage,
      occupancyRatePercentage,
      monthlySeries,
      upcomingDues: upcomingRows.map((cobranca) => {
        const charge = toStoredCharge(cobranca)

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
