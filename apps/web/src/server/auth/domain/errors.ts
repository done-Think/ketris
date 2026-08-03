import { AppError } from '@server/shared/errors'

export class InvalidCredentialsError extends AppError {
  constructor() {
    super('E-mail ou senha inválidos.', { status: 401, code: 'INVALID_CREDENTIALS' })
  }
}
