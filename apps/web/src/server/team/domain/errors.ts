import { AppError } from '@server/shared/errors'

export class TeamMemberNotFoundError extends AppError {
  constructor() {
    super('Corretor não encontrado.', { status: 404, code: 'TEAM_MEMBER_NOT_FOUND' })
  }
}

export class InvalidTransferDestinationError extends AppError {
  constructor() {
    super('Escolha outro corretor ativo da equipe para receber a carteira.', {
      status: 422,
      code: 'INVALID_TRANSFER_DESTINATION',
    })
  }
}

export class EmptyTransferError extends AppError {
  constructor() {
    super('Escolha ao menos um item para transferir.', { status: 422, code: 'EMPTY_TRANSFER' })
  }
}

export class CannotDeactivateSelfFromTeamError extends AppError {
  constructor() {
    super('Você não pode desativar a sua própria conta.', {
      status: 422,
      code: 'CANNOT_DEACTIVATE_SELF',
    })
  }
}

export class TeamInvitationNotFoundError extends AppError {
  constructor() {
    super('Convite não encontrado.', { status: 404, code: 'TEAM_INVITATION_NOT_FOUND' })
  }
}

export class TeamInvitationExpiredError extends AppError {
  constructor() {
    super('Este convite expirou. Peça um novo convite.', {
      status: 410,
      code: 'TEAM_INVITATION_EXPIRED',
    })
  }
}

export class TeamInvitationAlreadyAcceptedError extends AppError {
  constructor() {
    super('Este convite já foi usado.', { status: 409, code: 'TEAM_INVITATION_ALREADY_ACCEPTED' })
  }
}

export class TeamInvitationHasPortfolioError extends AppError {
  constructor() {
    super('Este convite já tem imóveis, leads ou eventos. Transfira antes de cancelar.', {
      status: 409,
      code: 'TEAM_INVITATION_HAS_PORTFOLIO',
    })
  }
}
