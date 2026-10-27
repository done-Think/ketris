import { AppError } from '@server/shared/errors'
import type { TenantLoginChoice } from '../types/tenant-login'
import type { EmailVerificationIdentity } from '../types/pending-email-verification'

export class EmailDeliveryFailedError extends AppError {
  constructor() {
    super('Não foi possível enviar o código de confirmação. Solicite um novo envio.', {
      status: 502,
      code: 'EMAIL_DELIVERY_FAILED',
    })
  }
}

export class PasswordTooLongError extends AppError {
  constructor() {
    super('A senha excede o limite de 72 bytes.', { status: 400, code: 'PASSWORD_TOO_LONG' })
  }
}

export class EmailConfirmationRequiredError extends AppError {
  constructor() {
    super('Confirme o novo e-mail antes de alterá-lo.', {
      status: 409,
      code: 'EMAIL_CONFIRMATION_REQUIRED',
    })
  }
}

export class InvalidEmailVerificationCodeError extends AppError {
  constructor() {
    super('Código de confirmação inválido ou expirado.', {
      status: 400,
      code: 'INVALID_EMAIL_VERIFICATION_CODE',
    })
  }
}

export class EmailVerificationRateLimitError extends AppError {
  constructor() {
    super('Aguarde antes de solicitar outro código.', {
      status: 429,
      code: 'RATE_LIMIT_EXCEEDED',
    })
  }
}

export class TenantSelectionRequiredError extends AppError {
  constructor(readonly tenants: TenantLoginChoice[]) {
    super('Selecione a conta que deseja acessar.', {
      status: 409,
      code: 'TENANT_SELECTION_REQUIRED',
    })
  }
}

export class TenantAccessBlockedError extends AppError {
  constructor() {
    super('O acesso desta conta está suspenso ou cancelado.', {
      status: 403,
      code: 'TENANT_ACCESS_BLOCKED',
    })
  }
}

export class EmailNotVerifiedError extends AppError {
  constructor(readonly verification?: EmailVerificationIdentity) {
    super('Confirme seu e-mail antes de acessar sua conta.', {
      status: 403,
      code: 'EMAIL_NOT_VERIFIED',
    })
  }
}

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

export class InvalidPasswordResetCodeError extends AppError {
  constructor() {
    super('Código de verificação inválido ou expirado.', {
      status: 401,
      code: 'INVALID_RESET_CODE',
    })
  }
}

export class InvalidPasswordResetTokenError extends AppError {
  constructor() {
    super('Sessão de redefinição de senha inválida ou expirada.', {
      status: 401,
      code: 'INVALID_RESET_TOKEN',
    })
  }
}

export class InvalidCurrentPasswordError extends AppError {
  constructor() {
    super('A senha atual está incorreta.', { status: 400, code: 'INVALID_CURRENT_PASSWORD' })
  }
}

export class AvatarValidationError extends AppError {
  constructor() {
    super(
      'Avatar inválido. Use uma imagem JPEG, PNG ou WebP de até 8 MiB enviada pelo próprio usuário.',
      { status: 400, code: 'AVATAR_VALIDATION_ERROR' },
    )
  }
}

export class PortfolioTransferRequiredError extends AppError {
  constructor() {
    super('Transfira os imóveis, leads e eventos futuros antes de desativar este usuário.', {
      status: 409,
      code: 'PORTFOLIO_TRANSFER_REQUIRED',
    })
  }
}
