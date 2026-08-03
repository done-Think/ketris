import { NextResponse } from 'next/server'

import { AppError } from '@server/shared/errors'

import { RequestValidationError } from './parse-body'

// Ponto único de tradução de erro -> resposta HTTP. Garante que nenhum Route Handler vaze stack trace ou
// mensagem interna do Prisma/Node pro cliente — só erros conhecidos (AppError) viram mensagem específica,
// qualquer coisa não mapeada vira 500 genérico.
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

  // eslint-disable-next-line no-console
  console.error('[BFF] erro não mapeado:', error)

  return NextResponse.json(
    { error: { code: 'INTERNAL_ERROR', message: 'Erro interno. Tente novamente.' } },
    { status: 500 },
  )
}

// Envolve um handler de rota, capturando qualquer erro lançado (Zod, AppError, ou inesperado) e
// traduzindo via handleRouteError — mantém os route.ts livres de try/catch repetido.
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
