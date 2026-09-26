import { AppError } from '@server/shared/errors'

export class InvalidCredentialsError extends AppError {
  constructor() {
    super('E-mail ou senha inválidos.', { status: 401, code: 'INVALID_CREDENTIALS' })
  }
}

export class AccountDeactivatedError extends AppError {
  constructor() {
    super('Esta conta foi desativada. Entre em contato com o administrador.', {
      status: 403,
      code: 'ACCOUNT_DEACTIVATED',
    })
  }
}

export class MembershipPendingApprovalError extends AppError {
  constructor() {
    super('Seu cadastro está aguardando aprovação do administrador da imobiliária.', {
      status: 403,
      code: 'MEMBERSHIP_PENDING_APPROVAL',
    })
  }
}

export class EmailAlreadyInUseError extends AppError {
  constructor() {
    super('Este e-mail já está em uso.', { status: 409, code: 'EMAIL_ALREADY_IN_USE' })
  }
}

export class InvalidRefreshTokenError extends AppError {
  constructor() {
    super('Refresh token inválido, expirado ou revogado.', {
      status: 401,
      code: 'INVALID_REFRESH_TOKEN',
    })
  }
}

export class UserNotFoundError extends AppError {
  constructor() {
    super('Usuário não encontrado.', { status: 404, code: 'USER_NOT_FOUND' })
  }
}

export class CannotDeactivateSelfError extends AppError {
  constructor() {
    super('Você não pode desativar sua própria conta.', {
      status: 400,
      code: 'CANNOT_DEACTIVATE_SELF',
    })
  }
}
