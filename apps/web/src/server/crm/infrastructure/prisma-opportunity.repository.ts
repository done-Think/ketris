import { Prisma } from '@prisma/client'
import { OpportunityLinkedToContractError } from '../domain/errors'
import type { CrmPage } from '../types/pagination'
import { crmChangedFields } from './crm-changed-fields'
import { crmMutationAuthor } from './crm-mutation-author'
import { crmPropertyInclude, toCrmProperty } from './crm-property.mapper'
import { readCrmPage } from './read-crm-page'

import type { CrmDatabase, CrmScope, OpportunityRow } from '../types/prisma'
import { recordCrmAudit } from './record-crm-audit'

import type {
  OpportunityListFilters,
  OpportunityRepository,
} from '../application/ports/opportunity-repository.port'
import type { NewOpportunity, Opportunity, OpportunityUpdate } from '../domain/opportunity.entity'

const responsibleInclude = { responsible: { select: { name: true } } } as const

function toDomain(row: OpportunityRow): Opportunity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    propertyId: row.propertyId,
    responsibleId: row.responsibleId,
    responsibleName: row.responsible.name,
    contactId: row.contactId,
    leadName: row.interestedName,
    leadEmail: row.interestedEmail,
    leadPhone: row.interestedPhone,
    proposedValue: row.proposedValue.toNumber(),
    contractTermMonths: row.contractTermMonths,
    desiredStartDate: row.desiredStart,
    guaranteeType: row.contractGuarantee,
    specialConditions: row.specialConditions,
    notes: row.notes,
    status: row.status,
    archivedAt: row.archivedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export class PrismaOpportunityRepository implements OpportunityRepository {
  constructor(
    private readonly db: CrmDatabase,
    private readonly scope: CrmScope,
  ) {}

  async create(opportunity: NewOpportunity): Promise<Opportunity> {
    const authorId = await crmMutationAuthor(this.db, this.scope)
    const row = await this.db.opportunity.create({
      data: {
        tenantId: this.scope.actorTenantId,
        updatedById: authorId,
        propertyId: opportunity.propertyId,
        responsibleId: opportunity.responsibleId,
        contactId: opportunity.contactId ?? undefined,
        interestedName: opportunity.leadName,
        interestedEmail: opportunity.leadEmail,
        interestedPhone: opportunity.leadPhone,
        proposedValue: opportunity.proposedValue,
        notes: opportunity.notes,
        status: opportunity.status ?? 'DRAFT',
        contractTermMonths: opportunity.contractTermMonths,
        desiredStart: opportunity.desiredStartDate,
        contractGuarantee: opportunity.guaranteeType,
        specialConditions: opportunity.specialConditions,
      },
      include: responsibleInclude,
    })

    await recordCrmAudit(this.db, this.scope, 'OPPORTUNITY', row.id, 'CREATED', [])
    return toDomain(row)
  }

  async findManyByTenant(
    tenantId: string,
    filters?: OpportunityListFilters,
  ): Promise<CrmPage<Opportunity>> {
    const page = await readCrmPage(this.db, this.scope, 'opportunity', filters)
    const rows = await this.db.opportunity.findMany({
      where: { id: { in: page.ids }, tenantId: this.scope.actorTenantId },
      include: { property: { include: crmPropertyInclude }, ...responsibleInclude },
    })
    const byId = new Map(
      rows.map((row) => [row.id, { ...toDomain(row), property: toCrmProperty(row.property) }]),
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

  async findById(id: string): Promise<Opportunity | null> {
    const row = await this.db.opportunity.findFirst({
      where: {
        id,
        tenantId: this.scope.actorTenantId,
        ...(this.scope.actorRole === 'AGENT' ? { responsibleId: this.scope.actorId ?? '' } : {}),
      },
      include: responsibleInclude,
    })

    return row ? toDomain(row) : null
  }

  async update(id: string, changes: OpportunityUpdate): Promise<Opportunity> {
    const authorId = await crmMutationAuthor(this.db, this.scope)
    const current = await this.findById(id)
    const changedFields = current ? crmChangedFields(current, changes) : []
    const row = await this.db.opportunity.update({
      where: {
        id,
        tenantId: this.scope.actorTenantId,
        ...(this.scope.actorRole === 'AGENT' ? { responsibleId: this.scope.actorId ?? '' } : {}),
      },
      data: {
        updatedById: authorId,
        contactId: changes.contactId,
        interestedName: changes.leadName,
        interestedEmail: changes.leadEmail,
        interestedPhone: changes.leadPhone,
        proposedValue: changes.proposedValue,
        contractTermMonths: changes.contractTermMonths,
        desiredStart: changes.desiredStartDate,
        contractGuarantee: changes.guaranteeType,
        specialConditions: changes.specialConditions,
        notes: changes.notes,
        status: changes.status,
      },
      include: responsibleInclude,
    })

    await recordCrmAudit(this.db, this.scope, 'OPPORTUNITY', row.id, 'UPDATED', changedFields)
    return toDomain(row)
  }

  async syncContactDetails(
    tenantId: string,
    contactId: string,
    details: { name: string; email: string; phone: string | null },
  ): Promise<void> {
    const authorId = await crmMutationAuthor(this.db, this.scope)
    const rows = await this.db.opportunity.findMany({
      where: { tenantId: this.scope.actorTenantId, contactId: contactId },
      select: {
        id: true,
        interestedName: true,
        interestedEmail: true,
        interestedPhone: true,
      },
    })
    for (const row of rows) {
      const fields = [
        ...(row.interestedName !== details.name ? ['leadName'] : []),
        ...(row.interestedEmail !== details.email ? ['leadEmail'] : []),
        ...(row.interestedPhone !== details.phone ? ['leadPhone'] : []),
      ]
      if (!fields.length) continue
      await this.db.opportunity.update({
        where: { id: row.id, tenantId: this.scope.actorTenantId },
        data: {
          updatedById: authorId,
          interestedName: details.name,
          interestedEmail: details.email,
          interestedPhone: details.phone,
        },
      })
      await recordCrmAudit(
        this.db,
        this.scope,
        'OPPORTUNITY',
        row.id,
        'CONTACT_SYNCHRONIZED',
        fields,
      )
    }
  }

  async archive(id: string): Promise<Opportunity> {
    const authorId = await crmMutationAuthor(this.db, this.scope)
    const current = await this.findById(id)
    if (current?.archivedAt) return current
    const row = await this.db.opportunity.update({
      where: {
        id,
        tenantId: this.scope.actorTenantId,
        ...(this.scope.actorRole === 'AGENT' ? { responsibleId: this.scope.actorId ?? '' } : {}),
      },
      data: { archivedAt: new Date(), archivedById: authorId, updatedById: authorId },
      include: responsibleInclude,
    })

    await recordCrmAudit(this.db, this.scope, 'OPPORTUNITY', row.id, 'ARCHIVED', ['archivedAt'])
    return toDomain(row)
  }

  async assignResponsible(id: string, responsibleId: string): Promise<Opportunity> {
    const authorId = await crmMutationAuthor(this.db, this.scope)
    const row = await this.db.opportunity.update({
      where: { id, tenantId: this.scope.actorTenantId },
      data: { responsibleId, updatedById: authorId },
      include: responsibleInclude,
    })

    await recordCrmAudit(this.db, this.scope, 'OPPORTUNITY', row.id, 'UPDATED', ['responsibleId'])
    return toDomain(row)
  }

  async delete(id: string): Promise<void> {
    await crmMutationAuthor(this.db, this.scope)
    const linked = await this.db.contract.findFirst({
      where: { sourceOpportunityId: id, tenantId: this.scope.actorTenantId },
      select: { id: true },
    })
    if (linked) throw new OpportunityLinkedToContractError()
    await recordCrmAudit(this.db, this.scope, 'OPPORTUNITY', id, 'DELETED', [])
    try {
      await this.db.opportunity.delete({
        where: {
          id,
          tenantId: this.scope.actorTenantId,
          ...(this.scope.actorRole === 'AGENT' ? { responsibleId: this.scope.actorId ?? '' } : {}),
        },
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003')
        throw new OpportunityLinkedToContractError()
      throw error
    }
  }

  async countByContact(
    tenantId: string,
    contactIds: readonly string[],
  ): Promise<Map<string, number>> {
    if (contactIds.length === 0) return new Map()

    const rows = await this.db.$queryRaw<{ contactId: string; count: bigint }[]>(Prisma.sql`
      SELECT o."contactId" AS "contactId", count(DISTINCT o."propertyId") AS count
      FROM opportunities o
      WHERE o."tenantId" = ${this.scope.actorTenantId} AND o."contactId" IN (${Prisma.join([...contactIds])})
        AND o."archivedAt" IS NULL
        ${this.scope.actorRole === 'AGENT' ? Prisma.sql`AND o."responsibleId" = ${this.scope.actorId ?? ''}` : Prisma.empty}
      GROUP BY o."contactId"`)
    return new Map(rows.map((row) => [row.contactId, Number(row.count)]))
  }

  async existsForAgent(tenantId: string, contactId: string, agentId: string): Promise<boolean> {
    const count = await this.db.opportunity.count({
      where: { tenantId, contactId: contactId, responsibleId: agentId },
    })

    return count > 0
  }
}
