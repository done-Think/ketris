import { AppError } from '@server/shared/errors'

export class RegistrationEmailAlreadyInUseError extends AppError {
  constructor() {
    super('Este e-mail já está em uso nesta conta.', { status: 409, code: 'EMAIL_ALREADY_IN_USE' })
  }
}

export class TermsAcceptanceRequiredError extends AppError {
  constructor() {
    super('Aceite os termos para continuar.', { status: 400, code: 'TERMS_ACCEPTANCE_REQUIRED' })
  }
}

export class AgencyNotFoundError extends AppError {
  constructor() {
    super('Imobiliária não encontrada.', { status: 404, code: 'AGENCY_NOT_FOUND' })
  }
}

export class RenterTenantNotConfiguredError extends AppError {
  constructor() {
    super('O tenant de locatários ainda não foi configurado. Rode o seed do banco.', {
      status: 503,
      code: 'RENTER_TENANT_NOT_CONFIGURED',
    })
  }
}
