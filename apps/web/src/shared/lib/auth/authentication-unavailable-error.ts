import { AppError } from '@server/shared/errors'

export class AuthenticationUnavailableError extends AppError {
  constructor() {
    super('Autenticação temporariamente indisponível.', { status: 503, code: 'AUTH_UNAVAILABLE' })
  }
}
