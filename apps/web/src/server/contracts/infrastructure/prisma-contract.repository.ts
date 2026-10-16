import type { Assinatura, Contrato, ParteContrato } from '@prisma/client'

import { prisma } from '@server/db/prisma'

import type {
  Contract,
  ContractAccessScope,
  ContractListFilters,
  ContractListResult,
  EligibleOpportunity,
  NewContract,
} from '../domain/contract.entity'
import type { ContractRepository } from '../application/ports/contract-repository.port'
import { ContractPartyAlreadySignedError } from '../domain/errors'

type UsuarioRef = { id: string; nome: string }

type ContratoWithRelations = Contrato & {
  ativadoPor: UsuarioRef | null
  partes: (ParteContrato & {
    assinatura: (Assinatura & { assinadaPor: UsuarioRef | null }) | null
  })[]
  documentos: { id: string; nome: string; url: string | null; createdAt: Date }[]
}

function toContractActor(usuario: UsuarioRef | null | undefined) {
  return usuario ? { id: usuario.id, name: usuario.nome } : null
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
    activatedBy: toContractActor(contrato.ativadoPor),
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
      signedBy: toContractActor(parte.assinatura?.assinadaPor),
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

async function generateContractCode(): Promise<string> {
  const year = new Date().getFullYear()
  const count = await prisma.contrato.count({
    where: { codigo: { startsWith: `CTR-${year}-` } },
  })

  return `CTR-${year}-${String(count + 1).padStart(4, '0')}`
}

const usuarioRefSelect = { select: { id: true, nome: true } } as const

function scopeWhere(scope: ContractAccessScope) {
  return scope.responsibleId ? { imovel: { responsavelId: scope.responsibleId } } : {}
}

const contractInclude = {
  ativadoPor: usuarioRefSelect,
  partes: { include: { assinatura: { include: { assinadaPor: usuarioRefSelect } } } },
  documentos: true,
} as const

export class PrismaContractRepository implements ContractRepository {
  async findEligibleOpportunity(
    tenantId: string,
    opportunityId: string,
    scope: ContractAccessScope,
  ): Promise<EligibleOpportunity | null> {
    const opportunity = await prisma.oportunidade.findFirst({
      where: { tenantId, id: opportunityId, ...scopeWhere(scope) },
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
    const codigo = await generateContractCode()

    const contrato = await prisma.contrato.create({
      data: {
        tenantId: input.tenantId,
        imovelId: opportunity.imovelId,
        oportunidadeOrigemId: input.opportunityId,
        codigo,
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
    })

    return toDomainContract(contrato)
  }

  async findMany(
    filters: ContractListFilters,
    scope: ContractAccessScope,
  ): Promise<ContractListResult> {
    const page = filters.page && filters.page > 0 ? Math.floor(filters.page) : 1
    const pageSize = filters.pageSize && filters.pageSize > 0 ? Math.floor(filters.pageSize) : 10
    const search = filters.search?.trim()

    const where = {
      tenantId: filters.tenantId,
      status: filters.status,
      tipo: filters.type,
      imovelId: filters.propertyId,
      ...scopeWhere(scope),
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

  async findById(
    tenantId: string,
    contractId: string,
    scope: ContractAccessScope,
  ): Promise<Contract | null> {
    const contrato = await prisma.contrato.findFirst({
      where: {
        tenantId,
        id: contractId,
        ...scopeWhere(scope),
      },
      include: contractInclude,
    })

    return contrato ? toDomainContract(contrato) : null
  }

  async signParty(
    tenantId: string,
    contractId: string,
    partyId: string,
    actorId: string,
  ): Promise<Contract> {
    const updated = await prisma.$transaction(async (tx) => {
      // Conditional on PENDENTE so two concurrent requests for the same party cannot both sign
      // it (the second would overwrite who signed); the loser gets a 409.
      const { count } = await tx.assinatura.updateMany({
        where: { parteContratoId: partyId, status: 'PENDENTE' },
        data: { status: 'ASSINADA', assinadaEm: new Date(), assinadaPorId: actorId },
      })

      if (count === 0) {
        throw new ContractPartyAlreadySignedError()
      }

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
          data: { status: 'ATIVO', ativadoEm: new Date(), ativadoPorId: actorId },
        })
        await tx.imovel.update({
          where: { id: contrato.imovelId },
          data: { status: contrato.imovel.finalidade === 'ALUGUEL' ? 'RENTED' : 'SOLD' },
        })
        const chargeYear = new Date().getFullYear()
        const chargeCount = await tx.cobranca.count({
          where: { codigo: { startsWith: `COB-${chargeYear}-` } },
        })
        await tx.cobranca.create({
          data: {
            tenantId,
            contratoId: contractId,
            codigo: `COB-${chargeYear}-${String(chargeCount + 1).padStart(4, '0')}`,
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
