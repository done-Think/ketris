import type { Prisma } from '@prisma/client'

import { prisma } from '@server/db/prisma'
import { nextSequentialCode } from '@server/shared/sequential-code'

import type {
  Charge,
  ChargeListFilters,
  ChargeListResult,
  ChargePaymentData,
  ChargeUpdateData,
  FinancialSummary,
  FinancialMonthlyTotal,
  NewCharge,
} from '../domain/charge.entity'
import type { ChargeReadScope } from '../types/charge-read-scope'
import type { ChargeRepository } from '../application/ports/charge-repository.port'
import type { CobrancaWithRelations } from '../types/prisma-charge-repository'

function buildPropertyAddress(
  endereco: { logradouro: string; bairro: string; cidade: string } | null,
): string | null {
  if (!endereco) return null

  const parts = [endereco.logradouro, endereco.bairro, endereco.cidade].filter(Boolean)

  return parts.length > 0 ? parts.join(', ') : null
}

function toDomainCharge(cobranca: CobrancaWithRelations): Charge {
  const payer = cobranca.contrato?.partes[0] ?? null

  return {
    id: cobranca.id,
    tenantId: cobranca.tenantId,
    code: cobranca.codigo,
    type: cobranca.tipo,
    status: cobranca.status,
    amount: cobranca.valor.toNumber(),
    dueDate: cobranca.vencimento,
    description: cobranca.descricao,
    paymentMethod: cobranca.formaPagamento,
    receiptUrl: cobranca.comprovanteUrl,
    paidAt: cobranca.pagoEm,
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

function generateChargeCode(tx: Prisma.TransactionClient): Promise<string> {
  return nextSequentialCode(tx, 'cobrancas', `COB-${new Date().getFullYear()}-`)
}

const chargeInclude = {
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

function monthRange(referenceDate: Date, monthsBack: number) {
  const start = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - monthsBack, 1)
  const end = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 1)

  return { start, end }
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

export class PrismaChargeRepository implements ChargeRepository {
  async findContractSummary(tenantId: string, contractId: string): Promise<{ id: string } | null> {
    const contrato = await prisma.contrato.findFirst({
      where: { tenantId, id: contractId },
      select: { id: true },
    })

    return contrato
  }

  async create(input: NewCharge): Promise<Charge> {
    const cobranca = await prisma.$transaction(async (tx) =>
      tx.cobranca.create({
        data: {
          tenantId: input.tenantId,
          contratoId: input.contractId,
          codigo: await generateChargeCode(tx),
          descricao: input.description,
          tipo: input.type,
          valor: input.amount,
          vencimento: input.dueDate,
          status: input.status,
        },
        include: chargeInclude,
      }),
    )

    return toDomainCharge(cobranca)
  }

  async findMany(filters: ChargeListFilters): Promise<ChargeListResult> {
    const page = filters.page && filters.page > 0 ? Math.floor(filters.page) : 1
    const pageSize = filters.pageSize && filters.pageSize > 0 ? Math.floor(filters.pageSize) : 10
    const search = filters.search?.trim()

    const where = {
      AND: [chargeReadWhere(filters.scope)],
      tipo: filters.type,
      status: filters.status,
      ...(search
        ? {
            OR: [
              { codigo: { contains: search, mode: 'insensitive' as const } },
              { descricao: { contains: search, mode: 'insensitive' as const } },
              {
                contrato: {
                  imovel: { titulo: { contains: search, mode: 'insensitive' as const } },
                },
              },
              {
                contrato: {
                  partes: {
                    some: {
                      papel: 'LOCATARIO' as const,
                      nome: { contains: search, mode: 'insensitive' as const },
                    },
                  },
                },
              },
            ],
          }
        : {}),
    }

    const [cobrancas, totalCount] = await Promise.all([
      prisma.cobranca.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { updatedAt: 'desc' },
        include: chargeInclude,
      }),
      prisma.cobranca.count({ where }),
    ])

    return {
      items: cobrancas.map((cobranca) => {
        const charge = toDomainCharge(cobranca)

        return {
          id: charge.id,
          code: charge.code,
          type: charge.type,
          status: charge.status,
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
    }
  }

  async findById(tenantId: string, chargeId: string): Promise<Charge | null> {
    return this.findReadableById({ kind: 'tenant', tenantId }, chargeId)
  }

  async findReadableById(scope: ChargeReadScope, chargeId: string): Promise<Charge | null> {
    const cobranca = await prisma.cobranca.findFirst({
      where: { ...chargeReadWhere(scope), id: chargeId },
      include: chargeInclude,
    })

    return cobranca ? toDomainCharge(cobranca) : null
  }

  async update(tenantId: string, chargeId: string, patch: ChargeUpdateData): Promise<Charge> {
    await prisma.cobranca.findFirstOrThrow({ where: { tenantId, id: chargeId } })

    const cobranca = await prisma.cobranca.update({
      where: { id: chargeId },
      data: {
        descricao: patch.description,
        tipo: patch.type,
        valor: patch.amount,
        vencimento: patch.dueDate,
        status: patch.status,
        formaPagamento: patch.paymentMethod,
        comprovanteUrl: patch.receiptUrl,
        pagoEm: patch.paidAt,
      },
      include: chargeInclude,
    })

    return toDomainCharge(cobranca)
  }

  async delete(tenantId: string, chargeId: string): Promise<void> {
    await prisma.cobranca.findFirstOrThrow({ where: { tenantId, id: chargeId } })

    await prisma.cobranca.delete({ where: { id: chargeId } })
  }

  async registerPayment(
    tenantId: string,
    chargeId: string,
    payment: ChargePaymentData,
  ): Promise<Charge> {
    await prisma.cobranca.findFirstOrThrow({ where: { tenantId, id: chargeId } })

    const cobranca = await prisma.cobranca.update({
      where: { id: chargeId },
      data: {
        status: 'PAGA',
        pagoEm: payment.paidAt,
        formaPagamento: payment.paymentMethod,
        comprovanteUrl: payment.receiptUrl,
      },
      include: chargeInclude,
    })

    return toDomainCharge(cobranca)
  }

  async getSummary(tenantId: string, referenceDate: Date): Promise<FinancialSummary> {
    const currentMonth = monthRange(referenceDate, 0)

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
        where: {
          tenantId,
          tipo: 'A_RECEBER',
          vencimento: { gte: currentMonth.start, lt: currentMonth.end },
          status: { in: ['PENDENTE', 'PAGA'] },
        },
      }),
      prisma.cobranca.aggregate({
        _sum: { valor: true },
        where: { tenantId, tipo: 'A_RECEBER', status: 'ATRASADA' },
      }),
      prisma.cobranca.aggregate({
        _sum: { valor: true },
        where: { tenantId, tipo: 'A_RECEBER', status: { not: 'CANCELADA' } },
      }),
      prisma.cobranca.findMany({
        where: {
          tenantId,
          tipo: 'A_RECEBER',
          vencimento: { gte: monthRange(referenceDate, 5).start, lt: currentMonth.end },
        },
        select: { valor: true, vencimento: true },
      }),
      prisma.cobranca.findMany({
        where: { tenantId, tipo: 'A_RECEBER', status: 'PENDENTE' },
        orderBy: { vencimento: 'asc' },
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
      const date = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - (5 - index), 1)
      return { year: date.getFullYear(), month: date.getMonth() + 1, total: 0 }
    })

    for (const row of seriesRows) {
      const bucket = monthlySeries.find(
        (entry) =>
          entry.year === row.vencimento.getFullYear() &&
          entry.month === row.vencimento.getMonth() + 1,
      )
      if (bucket) {
        bucket.total += row.valor.toNumber()
      }
    }

    const upcomingDues = upcomingRows.map((cobranca) => {
      const charge = toDomainCharge(cobranca)

      return {
        id: charge.id,
        code: charge.code,
        description: charge.description,
        payerName: charge.payerName,
        propertyId: charge.propertyId,
        propertyTitle: charge.propertyTitle,
        dueDate: charge.dueDate,
        amount: charge.amount,
        status: charge.status,
      }
    })

    return {
      monthlyReceivable,
      overdueTotal,
      defaultRatePercentage,
      occupancyRatePercentage,
      monthlySeries,
      upcomingDues,
    }
  }
}
