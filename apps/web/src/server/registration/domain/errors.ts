import { AppError } from '@server/shared/errors'

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
