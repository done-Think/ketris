import type { ActivityRow, CrmDatabase, CrmScope } from '../types/prisma'
import { recordCrmAudit } from './record-crm-audit'
import { crmMutationAuthor } from './crm-mutation-author'

import type { ActivityRepository } from '../application/ports/activity-repository.port'
import type { NewOpportunityActivity, OpportunityActivity } from '../domain/activity.entity'

function toDomain(row: ActivityRow): OpportunityActivity {
  return {
    id: row.id,
    opportunityId: row.opportunityId,
    type: row.type,
    description: row.description,
    systemAction: row.systemAction,
    authorId: row.authorId,
    authorName: row.authorName,
    previousStatus: row.previousStatus,
    newStatus: row.newStatus,
    createdAt: row.createdAt,
  }
}

export class PrismaActivityRepository implements ActivityRepository {
  constructor(
    private readonly db: CrmDatabase,
    private readonly scope: CrmScope,
  ) {}

  async create(activity: NewOpportunityActivity): Promise<OpportunityActivity> {
    const row = await this.db.opportunityActivity.create({
      data: {
        opportunityId: activity.opportunityId,
        type: activity.type,
        description: activity.description,
        systemAction: activity.systemAction,
        authorId: activity.authorId,
        authorName: activity.authorName,
        previousStatus: activity.previousStatus,
        newStatus: activity.newStatus,
      },
    })

    if (
      activity.type === 'CONTACT_MADE' &&
      activity.authorId &&
      activity.authorId === this.scope.actorId &&
      !activity.systemAction
    ) {
      const authorId = await crmMutationAuthor(this.db, this.scope)
      const opportunity = await this.db.opportunity.findFirst({
        where: { id: activity.opportunityId, tenantId: this.scope.actorTenantId },
        select: { contactId: true },
      })
      if (opportunity?.contactId) {
        const changed = await this.db.contact.updateMany({
          where: {
            id: opportunity.contactId,
            tenantId: this.scope.actorTenantId,
            archivedAt: null,
            OR: [{ lastInteraction: null }, { lastInteraction: { lt: row.createdAt } }],
          },
          data: { lastInteraction: row.createdAt, updatedById: authorId },
        })
        if (changed.count)
          await recordCrmAudit(this.db, this.scope, 'CONTACT', opportunity.contactId, 'UPDATED', [
            'lastInteraction',
          ])
      }
    }

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
    const rows = await this.db.opportunityActivity.findMany({
      where: {
        opportunityId: opportunityId,
        opportunity: { tenantId: this.scope.actorTenantId },
      },
      orderBy: { createdAt: 'desc' },
    })

    return rows.map((row) => toDomain(row))
  }
}
