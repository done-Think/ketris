import type { PasswordHasher } from '@server/auth/application/ports/password-hasher.port'
import { EmailAlreadyInUseError } from '@server/auth/domain/errors'
import type { Mailer } from '@server/shared/email/mailer.port'
import { normalizeEmail } from '@server/shared/normalize-email'

import {
  TeamInvitationAlreadyAcceptedError,
  TeamInvitationExpiredError,
  TeamInvitationHasPortfolioError,
  TeamInvitationNotFoundError,
} from '../../domain/errors'
import {
  generateTeamInvitationToken,
  generateUnusablePassword,
  hashTeamInvitationToken,
  teamInvitationExpiry,
} from '../../domain/team-invitation-token'
import type { StoredTeamInvitation } from '../../types/team-repository'
import type {
  AcceptTeamInvitationInput,
  BrokerInput,
  InviteBrokerInput,
  InviteBrokerOutput,
  ResendTeamInvitationInput,
  TeamInvitationPreview,
} from '../../types/use-case-inputs'
import type { TeamInvitationRepository } from '../ports/team-invitation-repository.port'
import type { TeamRepository } from '../ports/team-repository.port'
import { assertTeamManager, teamActorIdentity } from '../team-access'
import { buildTeamInvitationEmail } from '../team-invitation-email'
import { buildTeamInvitationLink } from '../team-invitation-link'
import type { AppLocale } from '@/i18n/types/locale.types'

async function deliverInvitation(
  mailer: Mailer,
  invitation: StoredTeamInvitation,
  token: string,
  inviterName: string,
  locale: AppLocale,
): Promise<boolean> {
  try {
    await mailer.send({
      to: invitation.email,
      ...(await buildTeamInvitationEmail({
        locale,
        link: buildTeamInvitationLink(token, locale),
        brokerName: invitation.name,
        agencyName: invitation.tenantName,
        inviterName,
      })),
    })
    return true
  } catch {
    console.error('[team] Invitation email delivery failed.')
    return false
  }
}

export class InviteBrokerUseCase {
  constructor(
    private readonly team: TeamRepository,
    private readonly invitations: TeamInvitationRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly mailer: Mailer,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(input: InviteBrokerInput): Promise<InviteBrokerOutput> {
    assertTeamManager(input)
    const email = normalizeEmail(input.email)
    if (await this.invitations.isEmailInUse(input.actorTenantId, email))
      throw new EmailAlreadyInUseError()
    const actor = await teamActorIdentity(this.team, input)
    const token = generateTeamInvitationToken()
    const invitation = await this.invitations.create({
      tenantId: input.actorTenantId,
      name: input.name.trim(),
      email,
      passwordHash: await this.passwordHasher.hash(generateUnusablePassword()),
      tokenHash: hashTeamInvitationToken(token),
      expiresAt: teamInvitationExpiry(this.now()),
      actor,
    })

    return {
      brokerId: invitation.userId,
      emailDelivered: await deliverInvitation(
        this.mailer,
        invitation,
        token,
        actor.name,
        input.locale,
      ),
    }
  }
}

export class ResendTeamInvitationUseCase {
  constructor(
    private readonly team: TeamRepository,
    private readonly invitations: TeamInvitationRepository,
    private readonly mailer: Mailer,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(input: ResendTeamInvitationInput): Promise<{ emailDelivered: boolean }> {
    assertTeamManager(input)
    const invitation = await this.invitations.findPendingByUser(input.actorTenantId, input.brokerId)
    if (!invitation) throw new TeamInvitationNotFoundError()
    const actor = await teamActorIdentity(this.team, input)
    const token = generateTeamInvitationToken()
    const now = this.now()
    const replaced = await this.invitations.replaceToken(
      input.actorTenantId,
      input.brokerId,
      hashTeamInvitationToken(token),
      teamInvitationExpiry(now),
      now,
    )
    if (!replaced) throw new TeamInvitationNotFoundError()

    return {
      emailDelivered: await deliverInvitation(
        this.mailer,
        invitation,
        token,
        actor.name,
        input.locale,
      ),
    }
  }
}

export class CancelTeamInvitationUseCase {
  constructor(private readonly invitations: TeamInvitationRepository) {}

  async execute(input: BrokerInput): Promise<void> {
    assertTeamManager(input)
    const invitation = await this.invitations.findPendingByUser(input.actorTenantId, input.brokerId)
    if (!invitation) throw new TeamInvitationNotFoundError()
    if (await this.invitations.hasPortfolio(input.actorTenantId, input.brokerId))
      throw new TeamInvitationHasPortfolioError()
    if (!(await this.invitations.deleteInvitedUser(input.actorTenantId, input.brokerId)))
      throw new TeamInvitationNotFoundError()
  }
}

export class GetTeamInvitationUseCase {
  constructor(
    private readonly invitations: TeamInvitationRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(token: string): Promise<TeamInvitationPreview> {
    const invitation = await this.invitations.findByTokenHash(hashTeamInvitationToken(token))
    if (!invitation) throw new TeamInvitationNotFoundError()

    return {
      name: invitation.name,
      email: invitation.email,
      agencyName: invitation.tenantName,
      status: invitation.acceptedAt
        ? 'ACCEPTED'
        : invitation.expiresAt <= this.now()
          ? 'EXPIRED'
          : 'VALID',
    }
  }
}

export class AcceptTeamInvitationUseCase {
  constructor(
    private readonly invitations: TeamInvitationRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(input: AcceptTeamInvitationInput): Promise<{ email: string; tenantId: string }> {
    const tokenHash = hashTeamInvitationToken(input.token)
    const invitation = await this.invitations.findByTokenHash(tokenHash)
    if (!invitation) throw new TeamInvitationNotFoundError()
    if (invitation.acceptedAt) throw new TeamInvitationAlreadyAcceptedError()
    const now = this.now()
    if (invitation.expiresAt <= now) throw new TeamInvitationExpiredError()
    const accepted = await this.invitations.accept(
      tokenHash,
      await this.passwordHasher.hash(input.password),
      now,
    )
    if (!accepted) throw new TeamInvitationAlreadyAcceptedError()

    return { email: invitation.email, tenantId: invitation.tenantId }
  }
}
