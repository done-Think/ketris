import type { Prisma } from '@prisma/client'

import { prisma } from '@server/db/prisma'

import type { Lead, LeadUpdate, NewLead } from '../domain/lead.entity'
import type { LeadListFilters, LeadRepository } from '../application/ports/lead-repository.port'

type LeadRow = {
  id: string
  tenantId: string
  responsavelId: string
  nome: string
  telefone: string
  email: string | null
  interesse: string
  orcamento: string
  origem: string
  estagio: Lead['stage']
  observacoes: string | null
  oportunidadeId: string | null
  createdAt: Date
  updatedAt: Date
}

function toDomain(row: LeadRow): Lead {
  return {
    id: row.id,
    tenantId: row.tenantId,
    responsavelId: row.responsavelId,
    name: row.nome,
    phone: row.telefone,
    email: row.email,
    interest: row.interesse,
    budget: row.orcamento,
    source: row.origem,
    stage: row.estagio,
    notes: row.observacoes,
    opportunityId: row.oportunidadeId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export class PrismaLeadRepository implements LeadRepository {
  async create(lead: NewLead): Promise<Lead> {
    const row = await prisma.lead.create({
      data: {
        tenantId: lead.tenantId,
        responsavelId: lead.responsavelId,
        nome: lead.name,
        telefone: lead.phone,
        email: lead.email,
        interesse: lead.interest,
        orcamento: lead.budget,
        origem: lead.source,
        observacoes: lead.notes,
      },
    })

    return toDomain(row as unknown as LeadRow)
  }

  async findManyByTenant(tenantId: string, filters?: LeadListFilters): Promise<Lead[]> {
    const where: Prisma.LeadWhereInput = { tenantId }

    if (filters?.responsavelId) where.responsavelId = filters.responsavelId

    const rows = await prisma.lead.findMany({ where, orderBy: { createdAt: 'desc' } })

    return rows.map((row) => toDomain(row as unknown as LeadRow))
  }

  async findById(id: string): Promise<Lead | null> {
    const row = await prisma.lead.findUnique({ where: { id } })

    return row ? toDomain(row as unknown as LeadRow) : null
  }

  async update(id: string, changes: LeadUpdate): Promise<Lead> {
    const row = await prisma.lead.update({
      where: { id },
      data: {
        estagio: changes.stage,
        observacoes: changes.notes,
      },
    })

    return toDomain(row as unknown as LeadRow)
  }

  async markConverted(id: string, opportunityId: string): Promise<Lead> {
    const row = await prisma.lead.update({
      where: { id },
      data: { estagio: 'PROPOSTA', oportunidadeId: opportunityId },
    })

    return toDomain(row as unknown as LeadRow)
  }
}
