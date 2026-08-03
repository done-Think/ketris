// Erro base para toda regra de negócio do BFF. Toda subclasse já carrega o status HTTP e um código
// estável (útil pro client discriminar sem parsear a mensagem, que é texto livre em pt-BR).
export class AppError extends Error {
  readonly status: number
  readonly code: string

  constructor(message: string, options: { status: number; code: string }) {
    super(message)
    this.name = new.target.name
    this.status = options.status
    this.code = options.code
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Recurso não encontrado.') {
    super(message, { status: 404, code: 'NOT_FOUND' })
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflito com o estado atual do recurso.') {
    super(message, { status: 409, code: 'CONFLICT' })
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Não autenticado.') {
    super(message, { status: 401, code: 'UNAUTHORIZED' })
  }
}
