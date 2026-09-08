import type { Prisma } from '@prisma/client'

import { prisma } from '@server/db/prisma'

import type { NewOpportunity, Opportunity, OpportunityUpdate } from '../domain/opportunity.entity'
import type {
  OpportunityListFilters,
  OpportunityRepository,
} from '../application/ports/opportunity-repository.port'

type DecimalLike = { toNumber(): number }

type OportunidadeRow = {
  id: string
  tenantId: string
  imovelId: string
  contatoId: string | null
  interessadoNome: string
  interessadoEmail: string
  interessadoTelefone: string | null
  valorProposto: DecimalLike
  prazoContratoMeses: number | null
  inicioPretendido: Date | null
  garantiaContratual: Opportunity['guaranteeType']
  condicoesEspeciais: string[]
  observacoes: string | null
  status: Opportunity['status']
  arquivadaEm: Date | null
  createdAt: Date
  updatedAt: Date
}

function toDomain(row: OportunidadeRow): Opportunity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    propertyId: row.imovelId,
    contactId: row.contatoId,
    leadName: row.interessadoNome,
    leadEmail: row.interessadoEmail,
    leadPhone: row.interessadoTelefone,
    proposedValue: row.valorProposto.toNumber(),
    contractTermMonths: row.prazoContratoMeses,
    desiredStartDate: row.inicioPretendido,
    guaranteeType: row.garantiaContratual,
    specialConditions: row.condicoesEspeciais,
    notes: row.observacoes,
    status: row.status,
    archivedAt: row.arquivadaEm,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export class PrismaOpportunityRepository implements OpportunityRepository {
  async create(opportunity: NewOpportunity): Promise<Opportunity> {
    const row = await prisma.oportunidade.create({
      data: {
        tenantId: opportunity.tenantId,
        imovelId: opportunity.propertyId,
        contatoId: opportunity.contactId ?? undefined,
        interessadoNome: opportunity.leadName,
        interessadoEmail: opportunity.leadEmail,
        interessadoTelefone: opportunity.leadPhone,
        valorProposto: opportunity.proposedValue,
        observacoes: opportunity.notes,
        status: opportunity.status ?? 'ENVIADA',
      },
    })

    return toDomain(row as unknown as OportunidadeRow)
  }

  async findManyByTenant(
    tenantId: string,
    filters?: OpportunityListFilters,
  ): Promise<Opportunity[]> {
    const where: Prisma.OportunidadeWhereInput = { tenantId }

    if (filters?.status) where.status = filters.status
    if (filters?.contactId) where.contatoId = filters.contactId
    if (!filters?.includeArchived) where.arquivadaEm = null

    const rows = await prisma.oportunidade.findMany({ where, orderBy: { createdAt: 'desc' } })

    return rows.map((row) => toDomain(row as unknown as OportunidadeRow))
  }

  async findById(id: string): Promise<Opportunity | null> {
    const row = await prisma.oportunidade.findUnique({ where: { id } })

    return row ? toDomain(row as unknown as OportunidadeRow) : null
  }

  async update(id: string, changes: OpportunityUpdate): Promise<Opportunity> {
    const row = await prisma.oportunidade.update({
      where: { id },
      data: {
        contatoId: changes.contactId,
        interessadoNome: changes.leadName,
        interessadoEmail: changes.leadEmail,
        interessadoTelefone: changes.leadPhone,
        valorProposto: changes.proposedValue,
        prazoContratoMeses: changes.contractTermMonths,
        inicioPretendido: changes.desiredStartDate,
        garantiaContratual: changes.guaranteeType,
        condicoesEspeciais: changes.specialConditions,
        observacoes: changes.notes,
        status: changes.status,
      },
    })

    return toDomain(row as unknown as OportunidadeRow)
  }

  async archive(id: string): Promise<Opportunity> {
    const row = await prisma.oportunidade.update({
      where: { id },
      data: { arquivadaEm: new Date() },
    })

    return toDomain(row as unknown as OportunidadeRow)
  }

  async delete(id: string): Promise<void> {
    await prisma.oportunidade.delete({ where: { id } })
  }

  async countByContact(
    tenantId: string,
    contactIds: readonly string[],
  ): Promise<Map<string, number>> {
    if (contactIds.length === 0) return new Map()

    const grouped = await prisma.oportunidade.groupBy({
      by: ['contatoId'],
      where: { tenantId, contatoId: { in: [...contactIds] }, arquivadaEm: null },
      _count: { _all: true },
    })

    return new Map(
      grouped
        .filter((group): group is typeof group & { contatoId: string } => group.contatoId !== null)
        .map((group) => [group.contatoId, group._count._all]),
    )
  }
}
