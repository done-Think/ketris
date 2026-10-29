import { prisma } from '@server/db/prisma'
import { recordUserAudit } from '@server/auth/infrastructure/user-audit'

import type { TeamInvitationRepository } from '../application/ports/team-invitation-repository.port'
import type { NewTeamInvitation, StoredTeamInvitation } from '../types/team-repository'

const invitationSelect = {
  userId: true,
  tenantId: true,
  expiresAt: true,
  acceptedAt: true,
  user: { select: { name: true, email: true } },
  tenant: { select: { name: true } },
} as const

type InvitationRecord = {
  userId: string
  tenantId: string
  expiresAt: Date
  acceptedAt: Date | null
  user: { name: string; email: string }
  tenant: { name: string }
}

function toStored(record: InvitationRecord): StoredTeamInvitation {
  return {
    userId: record.userId,
    tenantId: record.tenantId,
    tenantName: record.tenant.name,
    name: record.user.name,
    email: record.user.email,
    expiresAt: record.expiresAt,
    acceptedAt: record.acceptedAt,
  }
}

export class PrismaTeamInvitationRepository implements TeamInvitationRepository {
  async isEmailInUse(tenantId: string, email: string): Promise<boolean> {
    return (await prisma.user.count({ where: { tenantId, email } })) > 0
  }

  async create(invitation: NewTeamInvitation): Promise<StoredTeamInvitation> {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          tenantId: invitation.tenantId,
          name: invitation.name,
          email: invitation.email,
          passwordHash: invitation.passwordHash,
          role: 'AGENT',
          emailVerifiedAt: null,
          membershipApprovedAt: new Date(),
        },
      })
      await recordUserAudit(tx, {
        userId: user.id,
        tenantId: invitation.tenantId,
        action: 'CREATED',
        actor: { kind: 'USER', id: invitation.actor.id },
      })
      const record = await tx.teamInvitation.create({
        data: {
          tenantId: invitation.tenantId,
          userId: user.id,
          tokenHash: invitation.tokenHash,
          expiresAt: invitation.expiresAt,
          createdById: invitation.actor.id,
          createdByName: invitation.actor.name,
        },
        select: invitationSelect,
      })
      return toStored(record)
    })
  }

  async findPendingByUser(tenantId: string, userId: string): Promise<StoredTeamInvitation | null> {
    const record = await prisma.teamInvitation.findFirst({
      where: { tenantId, userId: userId, acceptedAt: null },
      select: invitationSelect,
    })

    return record ? toStored(record) : null
  }

  async replaceToken(
    tenantId: string,
    userId: string,
    tokenHash: string,
    expiresAt: Date,
    now: Date,
  ): Promise<boolean> {
    const { count } = await prisma.teamInvitation.updateMany({
      where: { tenantId, userId: userId, acceptedAt: null },
      data: { tokenHash, expiresAt: expiresAt, sentAt: now },
    })

    return count > 0
  }

  async hasPortfolio(tenantId: string, userId: string): Promise<boolean> {
    const [properties, leads, opportunities, events] = await Promise.all([
      prisma.property.count({ where: { tenantId, responsibleId: userId } }),
      prisma.lead.count({ where: { tenantId, responsibleId: userId } }),
      prisma.opportunity.count({ where: { tenantId, responsibleId: userId } }),
      prisma.agendaEvent.count({ where: { tenantId, responsibleId: userId } }),
    ])

    return properties + leads + opportunities + events > 0
  }

  async deleteInvitedUser(tenantId: string, userId: string): Promise<boolean> {
    const { count } = await prisma.user.deleteMany({
      where: { tenantId, id: userId, teamInvitation: { acceptedAt: null } },
    })

    return count > 0
  }

  async findByTokenHash(tokenHash: string): Promise<StoredTeamInvitation | null> {
    const record = await prisma.teamInvitation.findUnique({
      where: { tokenHash },
      select: invitationSelect,
    })

    return record ? toStored(record) : null
  }

  async accept(tokenHash: string, passwordHash: string, now: Date): Promise<boolean> {
    return prisma.$transaction(async (tx) => {
      const invitation = await tx.teamInvitation.findUnique({ where: { tokenHash } })
      if (!invitation) return false
      const { count } = await tx.teamInvitation.updateMany({
        where: { id: invitation.id, acceptedAt: null, expiresAt: { gt: now } },
        data: { acceptedAt: now },
      })
      if (!count) return false
      await tx.user.updateMany({
        where: { id: invitation.userId, tenantId: invitation.tenantId },
        data: {
          passwordHash: passwordHash,
          emailVerifiedAt: now,
          sessionVersion: { increment: 1 },
        },
      })
      await recordUserAudit(tx, {
        userId: invitation.userId,
        tenantId: invitation.tenantId,
        action: 'UPDATED',
        actor: { kind: 'SELF_REGISTRATION' },
        changedFields: ['password', 'emailVerified'],
      })
      return true
    })
  }
}
