import type { Assinatura, Contrato, ParteContrato, Prisma } from '@prisma/client'

import { prisma } from '@server/db/prisma'
import { nextSequentialCode } from '@server/shared/sequential-code'

import type {
  Contract,
  ContractListFilters,
  ContractListResult,
  EligibleOpportunity,
  NewContract,
} from '../domain/contract.entity'
import type { ContractRepository } from '../application/ports/contract-repository.port'

type ContratoWithRelations = Contrato & {
  partes: (ParteContrato & { assinatura: Assinatura | null })[]
  documentos: { id: string; nome: string; url: string | null; createdAt: Date }[]
}

function toDomainContract(contrato: ContratoWithRelations): Contract {
  return {
    id: contrato.id,
    tenantId: contrato.tenantId,
    propertyId: contrato.imovelId,
    opportunityId: contrato.oportunidadeOrigemId,
    code: contrato.codigo,
    type: contrato.tipo,
    amount: contrato.valor.toNumber(),
    dueDay: contrato.diaVencimento,
    startDate: contrato.dataInicio,
    endDate: contrato.dataFim,
    adjustmentIndex: contrato.indiceReajuste,
    guaranteeType: contrato.tipoGarantia,
    notes: contrato.observacoes,
    status: contrato.status,
    activatedAt: contrato.ativadoEm,
    createdAt: contrato.createdAt,
    updatedAt: contrato.updatedAt,
    parties: contrato.partes.map((parte) => ({
      id: parte.id,
      role: parte.papel,
      name: parte.nome,
      cpf: parte.cpf,
      email: parte.email,
      phone: parte.telefone,
      signatureStatus: parte.assinatura?.status ?? 'PENDENTE',
      signedAt: parte.assinatura?.assinadaEm ?? null,
    })),
    documents: contrato.documentos.map((documento) => ({
      id: documento.id,
      name: documento.nome,
      url: documento.url,
      createdAt: documento.createdAt,
    })),
  }
}

function computeNextDueDate(dueDay: number, from: Date): Date {
  const clampToMonth = (year: number, month: number) => {
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate()
    return new Date(year, month, Math.min(dueDay, lastDayOfMonth))
  }

  const candidate = clampToMonth(from.getFullYear(), from.getMonth())

  return candidate >= from ? candidate : clampToMonth(from.getFullYear(), from.getMonth() + 1)
}

function generateContractCode(tx: Prisma.TransactionClient): Promise<string> {
  return nextSequentialCode(tx, 'contratos', `CTR-${new Date().getFullYear()}-`)
}

const contractInclude = {
  partes: { include: { assinatura: true } },
  documentos: true,
} as const

export class PrismaContractRepository implements ContractRepository {
  async findEligibleOpportunity(
    tenantId: string,
    opportunityId: string,
  ): Promise<EligibleOpportunity | null> {
    const opportunity = await prisma.oportunidade.findFirst({
      where: { tenantId, id: opportunityId },
      select: { id: true, imovelId: true, status: true, contrato: { select: { id: true } } },
    })

    if (!opportunity) return null

    return {
      id: opportunity.id,
      propertyId: opportunity.imovelId,
      status: opportunity.status,
      hasContract: opportunity.contrato !== null,
    }
  }

  async create(input: NewContract): Promise<Contract> {
    const opportunity = await prisma.oportunidade.findFirstOrThrow({
      where: { tenantId: input.tenantId, id: input.opportunityId },
      select: { imovelId: true, valorProposto: true },
    })
    const contrato = await prisma.$transaction(async (tx) =>
      tx.contrato.create({
        data: {
          tenantId: input.tenantId,
          imovelId: opportunity.imovelId,
          oportunidadeOrigemId: input.opportunityId,
          codigo: await generateContractCode(tx),
          tipo: input.type,
          valor: opportunity.valorProposto,
          diaVencimento: input.dueDay,
          dataInicio: input.startDate,
          dataFim: input.endDate,
          indiceReajuste: input.adjustmentIndex,
          tipoGarantia: input.guaranteeType,
          observacoes: input.notes,
          status: 'AGUARDANDO_ASSINATURA',
          partes: {
            create: input.parties.map((party) => ({
              papel: party.role,
              nome: party.name,
              cpf: party.cpf,
              email: party.email,
              telefone: party.phone,
              assinatura: { create: {} },
            })),
          },
        },
        include: contractInclude,
      }),
    )

    return toDomainContract(contrato)
  }

  async findMany(filters: ContractListFilters): Promise<ContractListResult> {
    const page = filters.page && filters.page > 0 ? Math.floor(filters.page) : 1
    const pageSize = filters.pageSize && filters.pageSize > 0 ? Math.floor(filters.pageSize) : 10
    const search = filters.search?.trim()

    const where = {
      tenantId: filters.tenantId,
      status: filters.status,
      tipo: filters.type,
      imovelId: filters.propertyId,
      ...(search
        ? {
            OR: [
              { codigo: { contains: search, mode: 'insensitive' as const } },
              { imovel: { titulo: { contains: search, mode: 'insensitive' as const } } },
              { partes: { some: { nome: { contains: search, mode: 'insensitive' as const } } } },
            ],
          }
        : {}),
    }

    const [contratos, totalCount] = await Promise.all([
      prisma.contrato.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { updatedAt: 'desc' },
        include: {
          imovel: {
            select: {
              titulo: true,
              endereco: { select: { logradouro: true, bairro: true, cidade: true } },
            },
          },
          partes: { select: { papel: true, nome: true } },
        },
      }),
      prisma.contrato.count({ where }),
    ])

    return {
      items: contratos.map((contrato) => {
        const owner = contrato.partes.find((parte) => parte.papel === 'LOCADOR')
        const tenant = contrato.partes.find((parte) => parte.papel === 'LOCATARIO')
        const address = contrato.imovel.endereco
          ? [
              contrato.imovel.endereco.logradouro,
              contrato.imovel.endereco.bairro,
              contrato.imovel.endereco.cidade,
            ]
              .filter(Boolean)
              .join(', ')
          : ''

        return {
          id: contrato.id,
          code: contrato.codigo,
          opportunityId: contrato.oportunidadeOrigemId,
          propertyId: contrato.imovelId,
          propertyTitle: contrato.imovel.titulo,
          propertyAddress: address,
          ownerName: owner?.nome ?? null,
          tenantName: tenant?.nome ?? null,
          status: contrato.status,
          type: contrato.tipo,
          amount: contrato.valor.toNumber(),
          startDate: contrato.dataInicio,
          endDate: contrato.dataFim,
          updatedAt: contrato.updatedAt,
        }
      }),
      totalCount,
    }
  }

  async findById(tenantId: string, contractId: string): Promise<Contract | null> {
    const contrato = await prisma.contrato.findFirst({
      where: { tenantId, id: contractId },
      include: contractInclude,
    })

    return contrato ? toDomainContract(contrato) : null
  }

  async signParty(tenantId: string, contractId: string, partyId: string): Promise<Contract> {
    const updated = await prisma.$transaction(async (tx) => {
      await tx.assinatura.update({
        where: { parteContratoId: partyId },
        data: { status: 'ASSINADA', assinadaEm: new Date() },
      })

      const contrato = await tx.contrato.findFirstOrThrow({
        where: { tenantId, id: contractId },
        include: {
          partes: { include: { assinatura: true } },
          imovel: { select: { finalidade: true } },
        },
      })

      const allSigned = contrato.partes.every((parte) => parte.assinatura?.status === 'ASSINADA')

      if (allSigned && contrato.status !== 'ATIVO') {
        await tx.contrato.update({
          where: { id: contractId },
          data: { status: 'ATIVO', ativadoEm: new Date() },
        })
        await tx.imovel.update({
          where: { id: contrato.imovelId },
          data: { status: contrato.imovel.finalidade === 'ALUGUEL' ? 'RENTED' : 'SOLD' },
        })
        const chargeCode = await nextSequentialCode(
          tx,
          'cobrancas',
          `COB-${new Date().getFullYear()}-`,
        )
        await tx.cobranca.create({
          data: {
            tenantId,
            contratoId: contractId,
            codigo: chargeCode,
            tipo: 'A_RECEBER',
            valor: contrato.valor,
            vencimento: computeNextDueDate(contrato.diaVencimento, new Date()),
            status: 'PENDENTE',
          },
        })
      }

      return tx.contrato.findFirstOrThrow({
        where: { id: contractId },
        include: contractInclude,
      })
    })

    return toDomainContract(updated)
  }
}
