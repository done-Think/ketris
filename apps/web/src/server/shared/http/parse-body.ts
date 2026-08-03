import type { NextRequest } from 'next/server'
import type { ZodSchema } from 'zod'

import { AppError } from '@server/shared/errors'

export class RequestValidationError extends AppError {
  readonly issues: { path: string; message: string }[]

  constructor(issues: { path: string; message: string }[]) {
    super('Dados inválidos.', { status: 400, code: 'VALIDATION_ERROR' })
    this.issues = issues
  }
}

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
