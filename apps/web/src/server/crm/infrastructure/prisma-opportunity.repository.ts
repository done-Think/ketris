import { Prisma } from '@prisma/client'
import { OpportunityLinkedToContractError } from '../domain/errors'
import type { CrmPage } from '../types/pagination'
import { crmChangedFields } from './crm-changed-fields'
import { crmPropertyInclude, toCrmProperty } from './crm-property.mapper'
import { readCrmPage } from './read-crm-page'

import type { CrmDatabase, CrmScope, OportunidadeRow } from '../types/prisma'
import { recordCrmAudit } from './record-crm-audit'

import type {
  OpportunityListFilters,
  OpportunityRepository,
} from '../application/ports/opportunity-repository.port'
import type { NewOpportunity, Opportunity, OpportunityUpdate } from '../domain/opportunity.entity'

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
  constructor(
    private readonly db: CrmDatabase,
    private readonly scope: CrmScope,
  ) {}

  async create(opportunity: NewOpportunity): Promise<Opportunity> {
    const row = await this.db.oportunidade.create({
      data: {
        tenantId: this.scope.actorTenantId,
        imovelId: opportunity.propertyId,
        contatoId: opportunity.contactId ?? undefined,
        interessadoNome: opportunity.leadName,
        interessadoEmail: opportunity.leadEmail,
        interessadoTelefone: opportunity.leadPhone,
        valorProposto: opportunity.proposedValue,
        observacoes: opportunity.notes,
        status: opportunity.status ?? 'RASCUNHO',
        prazoContratoMeses: opportunity.contractTermMonths,
        inicioPretendido: opportunity.desiredStartDate,
        garantiaContratual: opportunity.guaranteeType,
        condicoesEspeciais: opportunity.specialConditions,
      },
    })

    await recordCrmAudit(this.db, this.scope, 'OPPORTUNITY', row.id, 'CREATED', [])
    return toDomain(row)
  }

  async findManyByTenant(
    tenantId: string,
    filters?: OpportunityListFilters,
  ): Promise<CrmPage<Opportunity>> {
    const page = await readCrmPage(this.db, this.scope, 'opportunity', filters)
    const rows = await this.db.oportunidade.findMany({
      where: { id: { in: page.ids }, tenantId: this.scope.actorTenantId },
      include: { imovel: { include: crmPropertyInclude } },
    })
    const byId = new Map(
      rows.map((row) => [row.id, { ...toDomain(row), property: toCrmProperty(row.imovel) }]),
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
    const row = await this.db.oportunidade.findFirst({
      where: {
        id,
        tenantId: this.scope.actorTenantId,
        ...(this.scope.actorPapel === 'AGENT'
          ? { imovel: { responsavelId: this.scope.actorId ?? '' } }
          : {}),
      },
    })

    return row ? toDomain(row) : null
  }

  async update(id: string, changes: OpportunityUpdate): Promise<Opportunity> {
    const current = await this.findById(id)
    const changedFields = current ? crmChangedFields(current, changes) : []
    const row = await this.db.oportunidade.update({
      where: {
        id,
        tenantId: this.scope.actorTenantId,
        ...(this.scope.actorPapel === 'AGENT'
          ? { imovel: { responsavelId: this.scope.actorId ?? '' } }
          : {}),
      },
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

    await recordCrmAudit(this.db, this.scope, 'OPPORTUNITY', row.id, 'UPDATED', changedFields)
    return toDomain(row)
  }

  async syncContactDetails(
    tenantId: string,
    contactId: string,
    details: { name: string; email: string; phone: string | null },
  ): Promise<void> {
    const rows = await this.db.oportunidade.findMany({
      where: { tenantId: this.scope.actorTenantId, contatoId: contactId },
      select: {
        id: true,
        interessadoNome: true,
        interessadoEmail: true,
        interessadoTelefone: true,
      },
    })
    for (const row of rows) {
      const fields = [
        ...(row.interessadoNome !== details.name ? ['leadName'] : []),
        ...(row.interessadoEmail !== details.email ? ['leadEmail'] : []),
        ...(row.interessadoTelefone !== details.phone ? ['leadPhone'] : []),
      ]
      if (!fields.length) continue
      await this.db.oportunidade.update({
        where: { id: row.id, tenantId: this.scope.actorTenantId },
        data: {
          interessadoNome: details.name,
          interessadoEmail: details.email,
          interessadoTelefone: details.phone,
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
    const row = await this.db.oportunidade.update({
      where: {
        id,
        tenantId: this.scope.actorTenantId,
        ...(this.scope.actorPapel === 'AGENT'
          ? { imovel: { responsavelId: this.scope.actorId ?? '' } }
          : {}),
      },
      data: { arquivadaEm: new Date() },
    })

    await recordCrmAudit(this.db, this.scope, 'OPPORTUNITY', row.id, 'ARCHIVED', ['archivedAt'])
    return toDomain(row)
  }

  async delete(id: string): Promise<void> {
    const linked = await this.db.contrato.findFirst({
      where: { oportunidadeOrigemId: id, tenantId: this.scope.actorTenantId },
      select: { id: true },
    })
    if (linked) throw new OpportunityLinkedToContractError()
    await recordCrmAudit(this.db, this.scope, 'OPPORTUNITY', id, 'DELETED', [])
    try {
      await this.db.oportunidade.delete({
        where: {
          id,
          tenantId: this.scope.actorTenantId,
          ...(this.scope.actorPapel === 'AGENT'
            ? { imovel: { responsavelId: this.scope.actorId ?? '' } }
            : {}),
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
      SELECT o."contatoId" AS "contactId", count(DISTINCT o."imovelId") AS count
      FROM oportunidades o JOIN imoveis i ON i.id = o."imovelId"
      WHERE o."tenantId" = ${this.scope.actorTenantId} AND o."contatoId" IN (${Prisma.join([...contactIds])})
        AND o."arquivadaEm" IS NULL
        ${this.scope.actorPapel === 'AGENT' ? Prisma.sql`AND i."responsavelId" = ${this.scope.actorId ?? ''}` : Prisma.empty}
      GROUP BY o."contatoId"`)
    return new Map(rows.map((row) => [row.contactId, Number(row.count)]))
  }

  async existsForAgent(tenantId: string, contactId: string, agentId: string): Promise<boolean> {
    const count = await this.db.oportunidade.count({
      where: { tenantId, contatoId: contactId, imovel: { responsavelId: agentId } },
    })

    return count > 0
  }
}
