import 'server-only'

import { BcryptPasswordHasher } from '@server/auth/infrastructure/bcrypt-password-hasher'
import { SesMailer } from '@server/shared/email/ses-mailer'
import { failureReporter } from '@server/shared/observability/sentry-failure-reporter'

import { GetTeamOverviewUseCase } from './application/use-cases/get-team-overview.use-case'
import {
  ListBrokerGoalsUseCase,
  SetBrokerGoalUseCase,
} from './application/use-cases/manage-broker-goal.use-case'
import {
  ActivateBrokerUseCase,
  ShareBrokerPortfolioUseCase,
  DeactivateBrokerUseCase,
  TransferBrokerPortfolioUseCase,
} from './application/use-cases/manage-broker-portfolio.use-case'
import {
  AcceptTeamInvitationUseCase,
  CancelTeamInvitationUseCase,
  GetTeamInvitationUseCase,
  InviteBrokerUseCase,
  ResendTeamInvitationUseCase,
} from './application/use-cases/manage-team-invitations.use-case'
import { RejectMembershipRequestUseCase } from './application/use-cases/reject-membership-request.use-case'
import { PrismaTeamInvitationRepository } from './infrastructure/prisma-team-invitation.repository'
import { PrismaTeamMembershipRequestRepository } from './infrastructure/prisma-team-membership-request.repository'
import { PrismaTeamRepository } from './infrastructure/prisma-team.repository'

const teamRepository = new PrismaTeamRepository()
const invitationRepository = new PrismaTeamInvitationRepository()
const membershipRequestRepository = new PrismaTeamMembershipRequestRepository()
const passwordHasher = new BcryptPasswordHasher()
const mailer = new SesMailer()

export const teamContainer = {
  getTeamOverviewUseCase: new GetTeamOverviewUseCase(teamRepository),
  setBrokerGoalUseCase: new SetBrokerGoalUseCase(teamRepository),
  listBrokerGoalsUseCase: new ListBrokerGoalsUseCase(teamRepository),
  transferBrokerPortfolioUseCase: new TransferBrokerPortfolioUseCase(teamRepository),
  shareBrokerPortfolioUseCase: new ShareBrokerPortfolioUseCase(teamRepository),
  deactivateBrokerUseCase: new DeactivateBrokerUseCase(teamRepository),
  activateBrokerUseCase: new ActivateBrokerUseCase(teamRepository),
  inviteBrokerUseCase: new InviteBrokerUseCase(
    teamRepository,
    invitationRepository,
    passwordHasher,
    mailer,
    failureReporter,
  ),
  resendTeamInvitationUseCase: new ResendTeamInvitationUseCase(
    teamRepository,
    invitationRepository,
    mailer,
    failureReporter,
  ),
  cancelTeamInvitationUseCase: new CancelTeamInvitationUseCase(
    teamRepository,
    invitationRepository,
  ),
  getTeamInvitationUseCase: new GetTeamInvitationUseCase(invitationRepository),
  acceptTeamInvitationUseCase: new AcceptTeamInvitationUseCase(
    invitationRepository,
    passwordHasher,
  ),
  rejectMembershipRequestUseCase: new RejectMembershipRequestUseCase(
    teamRepository,
    membershipRequestRepository,
  ),
}
