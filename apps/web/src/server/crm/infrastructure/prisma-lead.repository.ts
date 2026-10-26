import type { CrmPage } from '../types/pagination'
import { crmChangedFields } from './crm-changed-fields'
import { readCrmPage } from './read-crm-page'

import type { CrmDatabase, CrmScope, LeadRow } from '../types/prisma'
import { recordCrmAudit } from './record-crm-audit'

import type { LeadListFilters, LeadRepository } from '../application/ports/lead-repository.port'
import type { Lead, LeadUpdate, NewLead } from '../domain/lead.entity'

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
  constructor(
    private readonly db: CrmDatabase,
    private readonly scope: CrmScope,
  ) {}

  async create(lead: NewLead): Promise<Lead> {
    const row = await this.db.lead.create({
      data: {
        tenantId: this.scope.actorTenantId,
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

    await recordCrmAudit(this.db, this.scope, 'LEAD', row.id, 'CREATED', [])
    return toDomain(row)
  }

  async findManyByTenant(tenantId: string, filters?: LeadListFilters): Promise<CrmPage<Lead>> {
    const page = await readCrmPage(this.db, this.scope, 'lead', filters)
    const rows = await this.db.lead.findMany({
      where: { id: { in: page.ids }, tenantId: this.scope.actorTenantId },
      include: { responsavel: { select: { nome: true } } },
    })
    const byId = new Map(
      rows.map((row) => [row.id, { ...toDomain(row), responsibleName: row.responsavel.nome }]),
    )
    return {
      pagination: page.pagination,
      groups: page.groups,
      items: page.ids.flatMap((id) => {
        const item = byId.get(id)
        return item ? [item] : []
      }),
    }
  }

  async findById(id: string): Promise<Lead | null> {
    const row = await this.db.lead.findFirst({
      where: {
        id,
        tenantId: this.scope.actorTenantId,
        ...(this.scope.actorPapel === 'AGENT' ? { responsavelId: this.scope.actorId ?? '' } : {}),
      },
    })

    return row ? toDomain(row) : null
  }

  async update(id: string, changes: LeadUpdate): Promise<Lead> {
    const current = await this.findById(id)
    const changedFields = current ? crmChangedFields(current, changes) : []
    const row = await this.db.lead.update({
      where: {
        id,
        tenantId: this.scope.actorTenantId,
        ...(this.scope.actorPapel === 'AGENT' ? { responsavelId: this.scope.actorId ?? '' } : {}),
      },
      data: {
        estagio: changes.stage,
        observacoes: changes.notes,
      },
    })

    await recordCrmAudit(this.db, this.scope, 'LEAD', row.id, 'UPDATED', changedFields)
    return toDomain(row)
  }

  async markConverted(id: string, opportunityId: string, email?: string): Promise<Lead> {
    const row = await this.db.lead.update({
      where: {
        id,
        tenantId: this.scope.actorTenantId,
        ...(this.scope.actorPapel === 'AGENT' ? { responsavelId: this.scope.actorId ?? '' } : {}),
      },
      data: { estagio: 'PROPOSTA', oportunidadeId: opportunityId, email },
    })

    await recordCrmAudit(this.db, this.scope, 'LEAD', row.id, 'CONVERTED', [
      'stage',
      'opportunityId',
    ])
    return toDomain(row)
  }
}
