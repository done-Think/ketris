import { AppError } from '@server/shared/errors'

// Mensagem deliberadamente genérica — não revela se o e-mail existe (evita enumeração de contas),
// conforme Acceptance Scenario 3 de specs/002-fundacao-bff-banco/spec.md (User Story 2).
export class InvalidCredentialsError extends AppError {
  constructor() {
    super('E-mail ou senha inválidos.', { status: 401, code: 'INVALID_CREDENTIALS' })
  }
}
