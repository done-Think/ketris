import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { ZodError } from 'zod'

import { AppError } from '@server/shared/errors'

import { RequestValidationError } from './parse-body'
import { resolveRequestLocale } from './request-locale'
import { validationMessage } from './validation-messages'

export function handleRouteError(error: unknown, request?: Request): NextResponse {
  if (error instanceof ZodError) {
    return handleRouteError(
      RequestValidationError.fromZod(error.issues, resolveRequestLocale(request)),
      request,
    )
  }
  if (error instanceof RequestValidationError) {
    const locale = resolveRequestLocale(request, error.locale)
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: validationMessage(locale, 'invalidRequest'),
          issues: error.localizedIssues(locale),
        },
      },
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
  Sentry.captureException(error)

  return NextResponse.json(
    {
      error: {
        code: 'INTERNAL_ERROR',
        message: validationMessage(resolveRequestLocale(request), 'internalError'),
      },
    },
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
      const request = args.find(
        (argument): argument is Args[number] & Request => argument instanceof Request,
      )
      return handleRouteError(error, request)
    }
  }
}
