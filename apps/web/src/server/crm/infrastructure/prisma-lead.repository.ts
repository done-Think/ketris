import { crmMutationAuthor } from './crm-mutation-author'
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
    responsibleId: row.responsibleId,
    name: row.name,
    phone: row.phone,
    email: row.email,
    interest: row.interest,
    propertyId: row.propertyId,
    budget: row.budget,
    source: row.source,
    stage: row.stage,
    notes: row.notes,
    opportunityId: row.opportunityId,
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
    const authorId = await crmMutationAuthor(this.db, this.scope)
    const row = await this.db.lead.create({
      data: {
        tenantId: this.scope.actorTenantId,
        updatedById: authorId,
        responsibleId: lead.responsibleId,
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        interest: lead.interest,
        propertyId: lead.propertyId ?? null,
        budget: lead.budget,
        source: lead.source,
        notes: lead.notes,
      },
    })

    await recordCrmAudit(this.db, this.scope, 'LEAD', row.id, 'CREATED', [])
    return toDomain(row)
  }

  async findManyByTenant(tenantId: string, filters?: LeadListFilters): Promise<CrmPage<Lead>> {
    const page = await readCrmPage(this.db, this.scope, 'lead', filters)
    const rows = await this.db.lead.findMany({
      where: { id: { in: page.ids }, tenantId: this.scope.actorTenantId },
      include: { responsible: { select: { name: true } } },
    })
    const byId = new Map(
      rows.map((row) => [row.id, { ...toDomain(row), responsibleName: row.responsible.name }]),
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
        ...(this.scope.actorRole === 'AGENT' ? { responsibleId: this.scope.actorId ?? '' } : {}),
      },
    })

    return row ? toDomain(row) : null
  }

  async update(id: string, changes: LeadUpdate): Promise<Lead> {
    const current = await this.findById(id)
    const changedFields = current ? crmChangedFields(current, changes) : []
    const authorId = await crmMutationAuthor(this.db, this.scope)
    const row = await this.db.lead.update({
      where: {
        id,
        tenantId: this.scope.actorTenantId,
        ...(this.scope.actorRole === 'AGENT' ? { responsibleId: this.scope.actorId ?? '' } : {}),
      },
      data: {
        updatedById: authorId,
        stage: changes.stage,
        notes: changes.notes,
      },
    })

    if (changes.stage && changes.stage !== 'NEW') await this.markFirstContact(row.id)
    await recordCrmAudit(this.db, this.scope, 'LEAD', row.id, 'UPDATED', changedFields)
    return toDomain(row)
  }

  private async markFirstContact(id: string): Promise<void> {
    await this.db.lead.updateMany({
      where: { id, tenantId: this.scope.actorTenantId, firstContactAt: null },
      data: { firstContactAt: new Date() },
    })
  }

  async markConverted(id: string, opportunityId: string, email?: string): Promise<Lead> {
    const authorId = await crmMutationAuthor(this.db, this.scope)
    const row = await this.db.lead.update({
      where: {
        id,
        tenantId: this.scope.actorTenantId,
        ...(this.scope.actorRole === 'AGENT' ? { responsibleId: this.scope.actorId ?? '' } : {}),
      },
      data: { stage: 'PROPOSAL', opportunityId: opportunityId, email, updatedById: authorId },
    })

    await this.markFirstContact(row.id)
    await recordCrmAudit(this.db, this.scope, 'LEAD', row.id, 'CONVERTED', [
      'stage',
      'opportunityId',
    ])
    return toDomain(row)
  }
}
