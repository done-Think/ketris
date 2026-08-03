import type { NextRequest } from 'next/server'
import type { ZodSchema } from 'zod'

import { AppError } from '@server/shared/errors'

// Erro de validação — carrega os problemas por campo do Zod para o cliente conseguir destacar o input
// certo, em vez de só mostrar uma mensagem genérica.
export class RequestValidationError extends AppError {
  readonly issues: { path: string; message: string }[]

  constructor(issues: { path: string; message: string }[]) {
    super('Dados inválidos.', { status: 400, code: 'VALIDATION_ERROR' })
    this.issues = issues
  }
}

// Parseia e valida o body JSON de uma request contra um schema Zod. Único ponto de entrada de dados
// externos no BFF — todo Route Handler que recebe body deve passar por aqui, nunca por
// `await request.json()` cru.
export async function parseJsonBody<T>(request: NextRequest, schema: ZodSchema<T>): Promise<T> {
  let raw: unknown

  try {
    raw = await request.json()
  } catch {
    throw new RequestValidationError([
      { path: '', message: 'Corpo da requisição não é um JSON válido.' },
    ])
  }

  const result = schema.safeParse(raw)

  if (!result.success) {
    const issues = result.error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }))
    throw new RequestValidationError(issues)
  }

  return result.data
}
