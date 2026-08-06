import { AppError } from '@server/shared/errors'

export class InvalidPlatformCredentialsError extends AppError {
  constructor() {
    super('E-mail ou senha inválidos.', { status: 401, code: 'INVALID_PLATFORM_CREDENTIALS' })
  }
}

export class InvalidPlatformRefreshTokenError extends AppError {
  constructor() {
    super('Refresh token inválido, expirado ou revogado.', {
      status: 401,
      code: 'INVALID_PLATFORM_REFRESH_TOKEN',
    })
  }
}

export class PlatformAdminEmailAlreadyInUseError extends AppError {
  constructor() {
    super('Este e-mail já está em uso por outro platform admin.', {
      status: 409,
      code: 'PLATFORM_ADMIN_EMAIL_ALREADY_IN_USE',
    })
  }
}

export class PlatformAdminNotFoundError extends AppError {
  constructor() {
    super('Platform admin não encontrado.', { status: 404, code: 'PLATFORM_ADMIN_NOT_FOUND' })
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

export class TenantSlugAlreadyInUseError extends AppError {
  constructor() {
    super('Já existe um tenant com este slug.', {
      status: 409,
      code: 'TENANT_SLUG_ALREADY_IN_USE',
    })
  }
}

export class TenantNotFoundError extends AppError {
  constructor() {
    super('Tenant não encontrado.', { status: 404, code: 'TENANT_NOT_FOUND' })
  }
}
