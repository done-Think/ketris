import { prisma } from '@server/db/prisma'
import { recordUserAudit } from '@server/auth/infrastructure/user-audit'

import type { TeamInvitationRepository } from '../application/ports/team-invitation-repository.port'
import type { NewTeamInvitation, StoredTeamInvitation } from '../types/team-repository'

const invitationSelect = {
  usuarioId: true,
  tenantId: true,
  expiraEm: true,
  aceitoEm: true,
  usuario: { select: { nome: true, email: true } },
  tenant: { select: { nome: true } },
} as const

type InvitationRecord = {
  usuarioId: string
  tenantId: string
  expiraEm: Date
  aceitoEm: Date | null
  usuario: { nome: string; email: string }
  tenant: { nome: string }
}

function toStored(record: InvitationRecord): StoredTeamInvitation {
  return {
    userId: record.usuarioId,
    tenantId: record.tenantId,
    tenantName: record.tenant.nome,
    name: record.usuario.nome,
    email: record.usuario.email,
    expiresAt: record.expiraEm,
    acceptedAt: record.aceitoEm,
  }
}

export class PrismaTeamInvitationRepository implements TeamInvitationRepository {
  async isEmailInUse(tenantId: string, email: string): Promise<boolean> {
    return (await prisma.usuario.count({ where: { tenantId, email } })) > 0
  }

  async create(invitation: NewTeamInvitation): Promise<StoredTeamInvitation> {
    return prisma.$transaction(async (tx) => {
      const user = await tx.usuario.create({
        data: {
          tenantId: invitation.tenantId,
          nome: invitation.name,
          email: invitation.email,
          senhaHash: invitation.passwordHash,
          papel: 'AGENT',
          emailVerificadoEm: null,
          vinculoAprovadoEm: new Date(),
        },
      })
      await recordUserAudit(tx, {
        userId: user.id,
        tenantId: invitation.tenantId,
        action: 'CREATED',
        actor: { kind: 'USER', id: invitation.actor.id },
      })
      const record = await tx.conviteEquipe.create({
        data: {
          tenantId: invitation.tenantId,
          usuarioId: user.id,
          tokenHash: invitation.tokenHash,
          expiraEm: invitation.expiresAt,
          criadoPorId: invitation.actor.id,
          criadoPorNome: invitation.actor.name,
        },
        select: invitationSelect,
      })
      return toStored(record)
    })
  }

  async findPendingByUser(tenantId: string, userId: string): Promise<StoredTeamInvitation | null> {
    const record = await prisma.conviteEquipe.findFirst({
      where: { tenantId, usuarioId: userId, aceitoEm: null },
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
    const { count } = await prisma.conviteEquipe.updateMany({
      where: { tenantId, usuarioId: userId, aceitoEm: null },
      data: { tokenHash, expiraEm: expiresAt, enviadoEm: now },
    })

    return count > 0
  }

  async hasPortfolio(tenantId: string, userId: string): Promise<boolean> {
    const [properties, leads, events] = await Promise.all([
      prisma.imovel.count({ where: { tenantId, responsavelId: userId } }),
      prisma.lead.count({ where: { tenantId, responsavelId: userId } }),
      prisma.eventoAgenda.count({ where: { tenantId, responsavelId: userId } }),
    ])

    return properties + leads + events > 0
  }

  async deleteInvitedUser(tenantId: string, userId: string): Promise<boolean> {
    const { count } = await prisma.usuario.deleteMany({
      where: { tenantId, id: userId, conviteEquipe: { aceitoEm: null } },
    })

    return count > 0
  }

  async findByTokenHash(tokenHash: string): Promise<StoredTeamInvitation | null> {
    const record = await prisma.conviteEquipe.findUnique({
      where: { tokenHash },
      select: invitationSelect,
    })

    return record ? toStored(record) : null
  }

  async accept(tokenHash: string, passwordHash: string, now: Date): Promise<boolean> {
    return prisma.$transaction(async (tx) => {
      const invitation = await tx.conviteEquipe.findUnique({ where: { tokenHash } })
      if (!invitation) return false
      const { count } = await tx.conviteEquipe.updateMany({
        where: { id: invitation.id, aceitoEm: null, expiraEm: { gt: now } },
        data: { aceitoEm: now },
      })
      if (!count) return false
      await tx.usuario.updateMany({
        where: { id: invitation.usuarioId, tenantId: invitation.tenantId },
        data: {
          senhaHash: passwordHash,
          emailVerificadoEm: now,
          versaoSessao: { increment: 1 },
        },
      })
      await recordUserAudit(tx, {
        userId: invitation.usuarioId,
        tenantId: invitation.tenantId,
        action: 'UPDATED',
        actor: { kind: 'SELF_REGISTRATION' },
        changedFields: ['password', 'emailVerified'],
      })
      return true
    })
  }
}
