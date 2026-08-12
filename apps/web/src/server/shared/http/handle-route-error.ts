import { NextResponse } from 'next/server'

import { AppError } from '@server/shared/errors'

import { RequestValidationError } from './parse-body'

export function handleRouteError(error: unknown): NextResponse {
  if (error instanceof RequestValidationError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message, issues: error.issues } },
      { status: error.status },
    )
  }

  if (error instanceof AppError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message } },
      { status: error.status },
    )
  }

  console.error('[BFF] erro não mapeado:', error)

  return NextResponse.json(
    { error: { code: 'INTERNAL_ERROR', message: 'Erro interno. Tente novamente.' } },
    { status: 500 },
  )
}

export function withErrorHandling<Args extends unknown[]>(
  handler: (...args: Args) => Promise<NextResponse>,
): (...args: Args) => Promise<NextResponse> {
  return async (...args: Args) => {
    try {
      return await handler(...args)
    } catch (error) {
      return handleRouteError(error)
    }
  }
}
