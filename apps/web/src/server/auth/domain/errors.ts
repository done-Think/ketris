import { AppError } from '@server/shared/errors'

export class InvalidCredentialsError extends AppError {
  constructor() {
    super('E-mail ou senha inválidos.', { status: 401, code: 'INVALID_CREDENTIALS' })
  }
}

export class EmailAlreadyInUseError extends AppError {
  constructor() {
    super('Este e-mail já está em uso.', { status: 409, code: 'EMAIL_ALREADY_IN_USE' })
  }
}
