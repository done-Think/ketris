import { BcryptPasswordHasher } from '@server/auth/infrastructure/bcrypt-password-hasher'
import { SesMailer } from '@server/shared/email/ses-mailer'

import { GetTeamOverviewUseCase } from './application/use-cases/get-team-overview.use-case'
import {
  ListBrokerGoalsUseCase,
  SetBrokerGoalUseCase,
} from './application/use-cases/manage-broker-goal.use-case'
import {
  ActivateBrokerUseCase,
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
import { PrismaTeamInvitationRepository } from './infrastructure/prisma-team-invitation.repository'
import { PrismaTeamRepository } from './infrastructure/prisma-team.repository'

const teamRepository = new PrismaTeamRepository()
const invitationRepository = new PrismaTeamInvitationRepository()
const passwordHasher = new BcryptPasswordHasher()
const mailer = new SesMailer()

export const teamContainer = {
  getTeamOverviewUseCase: new GetTeamOverviewUseCase(teamRepository),
  setBrokerGoalUseCase: new SetBrokerGoalUseCase(teamRepository),
  listBrokerGoalsUseCase: new ListBrokerGoalsUseCase(teamRepository),
  transferBrokerPortfolioUseCase: new TransferBrokerPortfolioUseCase(teamRepository),
  deactivateBrokerUseCase: new DeactivateBrokerUseCase(teamRepository),
  activateBrokerUseCase: new ActivateBrokerUseCase(teamRepository),
  inviteBrokerUseCase: new InviteBrokerUseCase(
    teamRepository,
    invitationRepository,
    passwordHasher,
    mailer,
  ),
  resendTeamInvitationUseCase: new ResendTeamInvitationUseCase(
    teamRepository,
    invitationRepository,
    mailer,
  ),
  cancelTeamInvitationUseCase: new CancelTeamInvitationUseCase(invitationRepository),
  getTeamInvitationUseCase: new GetTeamInvitationUseCase(invitationRepository),
  acceptTeamInvitationUseCase: new AcceptTeamInvitationUseCase(
    invitationRepository,
    passwordHasher,
  ),
}
