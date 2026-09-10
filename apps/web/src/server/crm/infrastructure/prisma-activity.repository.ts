import { prisma } from '@server/db/prisma'

import type { NewOpportunityActivity, OpportunityActivity } from '../domain/activity.entity'
import type { ActivityRepository } from '../application/ports/activity-repository.port'

type AtividadeRow = {
  id: string
  oportunidadeId: string
  tipo: OpportunityActivity['type']
  descricao: string
  autorId: string | null
  autorNome: string | null
  statusAnterior: OpportunityActivity['previousStatus']
  statusNovo: OpportunityActivity['newStatus']
  createdAt: Date
}

function toDomain(row: AtividadeRow): OpportunityActivity {
  return {
    id: row.id,
    opportunityId: row.oportunidadeId,
    type: row.tipo,
    description: row.descricao,
    authorId: row.autorId,
    authorName: row.autorNome,
    previousStatus: row.statusAnterior,
    newStatus: row.statusNovo,
    createdAt: row.createdAt,
  }
}

export class PrismaActivityRepository implements ActivityRepository {
  async create(activity: NewOpportunityActivity): Promise<OpportunityActivity> {
    const row = await prisma.atividadeOportunidade.create({
      data: {
        oportunidadeId: activity.opportunityId,
        tipo: activity.type,
        descricao: activity.description,
        autorId: activity.authorId,
        autorNome: activity.authorName,
        statusAnterior: activity.previousStatus,
        statusNovo: activity.newStatus,
      },
    })

    return toDomain(row as unknown as AtividadeRow)
  }

  async findManyByOpportunity(opportunityId: string): Promise<OpportunityActivity[]> {
    const rows = await prisma.atividadeOportunidade.findMany({
      where: { oportunidadeId: opportunityId },
      orderBy: { createdAt: 'desc' },
    })

    return rows.map((row) => toDomain(row as unknown as AtividadeRow))
  }
}
