import type { AtividadeRow, CrmDatabase, CrmScope } from '../types/prisma'
import { recordCrmAudit } from './record-crm-audit'

import type { ActivityRepository } from '../application/ports/activity-repository.port'
import type { NewOpportunityActivity, OpportunityActivity } from '../domain/activity.entity'

function toDomain(row: AtividadeRow): OpportunityActivity {
  return {
    id: row.id,
    opportunityId: row.oportunidadeId,
    type: row.tipo,
    description: row.descricao,
    systemAction: row.systemAction,
    authorId: row.autorId,
    authorName: row.autorNome,
    previousStatus: row.statusAnterior,
    newStatus: row.statusNovo,
    createdAt: row.createdAt,
  }
}

export class PrismaActivityRepository implements ActivityRepository {
  constructor(
    private readonly db: CrmDatabase,
    private readonly scope: CrmScope,
  ) {}

  async create(activity: NewOpportunityActivity): Promise<OpportunityActivity> {
    const row = await this.db.atividadeOportunidade.create({
      data: {
        oportunidadeId: activity.opportunityId,
        tipo: activity.type,
        descricao: activity.description,
        systemAction: activity.systemAction,
        autorId: activity.authorId,
        autorNome: activity.authorName,
        statusAnterior: activity.previousStatus,
        statusNovo: activity.newStatus,
      },
    })

    await recordCrmAudit(
      this.db,
      this.scope,
      'OPPORTUNITY',
      activity.opportunityId,
      'ACTIVITY_ADDED',
      ['activities'],
    )
    return toDomain(row)
  }

  async findManyByOpportunity(opportunityId: string): Promise<OpportunityActivity[]> {
    const rows = await this.db.atividadeOportunidade.findMany({
      where: {
        oportunidadeId: opportunityId,
        oportunidade: { tenantId: this.scope.actorTenantId },
      },
      orderBy: { createdAt: 'desc' },
    })

    return rows.map((row) => toDomain(row))
  }
}
