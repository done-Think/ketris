import { isAgencyManager } from '@server/auth/domain/roles'
import type { InteractionRepository } from '../application/ports/interaction-repository.port'
import type { CompleteInteractionInput } from '../types/complete-interaction.use-case.types'
import type { CrmInteraction, StartInteractionInput } from '../types/interaction'
import type { ListInteractionsInput } from '../types/list-interactions.use-case.types'
import type { CrmDatabase, CrmScope } from '../types/prisma'
import { crmMutationAuthor } from './crm-mutation-author'
import { recordCrmAudit } from './record-crm-audit'
import {
  interactionAccess,
  interactionInclude as include,
  interactionTarget,
  type InteractionRow,
} from './interaction-query'
import { confirmInteractionContact } from './confirm-interaction-contact'

export class PrismaInteractionRepository implements InteractionRepository {
  constructor(
    private readonly db: CrmDatabase,
    private readonly scope: CrmScope,
  ) {}
  private map(row: InteractionRow): CrmInteraction {
    return {
      id: row.id,
      kind: row.kind,
      leadId: row.leadId,
      leadName: row.lead?.name ?? null,
      contactId: row.contactId ?? row.lead?.contactId ?? row.lead?.opportunity?.contactId ?? null,
      previousStage: row.previousStage,
      nextStage: row.nextStage,
      opportunityId: row.lead?.opportunityId ?? null,
      channel: row.channel,
      status: row.status,
      description: row.description,
      actorUserId: row.actorUserId,
      actorName: row.actorName,
      completedById: row.completedById,
      createdAt: row.createdAt,
      completedAt: row.completedAt,
      canComplete:
        row.kind === 'CONTACT_ATTEMPT' &&
        row.status === 'STARTED' &&
        (isAgencyManager(this.scope.actorRole) || this.scope.actorId === row.actorUserId),
    }
  }
  async findById(id: string) {
    const row = await this.db.crmInteraction.findFirst({
      where: { ...interactionAccess(this.scope), id },
      include,
    })
    return row ? this.map(row) : null
  }
  async findByRequestId(requestId: string) {
    const row = await this.db.crmInteraction.findFirst({
      where: { tenantId: this.scope.actorTenantId, requestId },
      include,
    })
    return row ? this.map(row) : null
  }
  async start(input: StartInteractionInput) {
    await crmMutationAuthor(this.db, this.scope)
    const actor = await this.db.user.findFirstOrThrow({
      where: { id: input.actorId, tenantId: input.actorTenantId, active: true },
      select: { name: true },
    })
    const row = await this.db.crmInteraction.create({
      data: {
        tenantId: input.actorTenantId,
        leadId: input.leadId,
        contactId: input.contactId,
        requestId: input.requestId,
        channel: input.channel,
        actorUserId: input.actorId,
        actorName: actor.name,
      },
      include,
    })
    await recordCrmAudit(
      this.db,
      this.scope,
      row.leadId ? 'LEAD' : 'CONTACT',
      row.leadId ?? row.contactId!,
      'INTERACTION_STARTED',
      ['interactions'],
    )
    return this.map(row)
  }
  async complete(input: CompleteInteractionInput) {
    await crmMutationAuthor(this.db, this.scope)
    const completedAt = new Date()
    const row = await this.db.crmInteraction.update({
      where: {
        ...interactionAccess(this.scope),
        id: input.interactionId,
        kind: 'CONTACT_ATTEMPT',
        status: 'STARTED',
      },
      data: {
        status: input.status,
        description: input.description || null,
        completedById: input.actorId,
        completedAt,
      },
      include,
    })
    if (input.status === 'CONTACT_MADE')
      await confirmInteractionContact(this.db, this.scope, row, completedAt)
    await recordCrmAudit(
      this.db,
      this.scope,
      row.leadId ? 'LEAD' : 'CONTACT',
      row.leadId ?? row.contactId!,
      'INTERACTION_COMPLETED',
      ['interactions'],
    )
    return this.map(row)
  }
  async list(input: ListInteractionsInput) {
    const where = {
      AND: [
        interactionAccess(this.scope),
        await interactionTarget(this.db, this.scope, input.target),
      ],
    }
    const totalCount = await this.db.crmInteraction.count({ where })
    const pageCount = Math.max(1, Math.ceil(totalCount / input.pageSize))
    const page = Math.min(input.page, pageCount)
    const rows = await this.db.crmInteraction.findMany({
      where,
      include,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * input.pageSize,
      take: input.pageSize,
    })
    return {
      interactions: rows.map((row) => this.map(row)),
      pagination: { page, pageSize: input.pageSize, pageCount, totalCount },
    }
  }
}
