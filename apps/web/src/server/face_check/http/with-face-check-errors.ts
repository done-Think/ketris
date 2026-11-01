import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { AppError } from '@server/shared/errors'
import { withErrorHandling } from '@server/shared/http'
import { faceCheckErrorMessage } from './error-messages'
import { reportUnexpectedFaceCheckFailure } from './telemetry'

export function withFaceCheckErrors<Args extends [Request, ...unknown[]]>(
  handler: (...args: Args) => Promise<NextResponse>,
) {
  return withErrorHandling(async (...args: Args) => {
    const request = args[0]
    try {
      const response = await handler(...args)
      response.headers.set('Cache-Control', 'private, no-store')
      response.headers.set('X-Content-Type-Options', 'nosniff')
      response.headers.set('Referrer-Policy', 'no-referrer')
      return response
    } catch (error) {
      // No exception payload is logged: SDK/validation errors may carry tokens, names or image bytes.
      const code =
        error instanceof ZodError
          ? 'VALIDATION_ERROR'
          : error instanceof AppError
            ? error.code
            : 'INTERNAL_ERROR'
      const status =
        error instanceof ZodError ? 400 : error instanceof AppError ? error.status : 500
      if (code === 'INTERNAL_ERROR') reportUnexpectedFaceCheckFailure()
      const reason =
        error && typeof error === 'object' && 'reason' in error && typeof error.reason === 'string'
          ? error.reason
          : undefined
      return NextResponse.json(
        {
          error: {
            code,
            message: faceCheckErrorMessage(code, request),
            ...(reason ? { reason } : {}),
          },
        },
        {
          status,
          headers: {
            'Cache-Control': 'private, no-store',
            'X-Content-Type-Options': 'nosniff',
            'Referrer-Policy': 'no-referrer',
            ...(status === 429 ? { 'Retry-After': '60' } : {}),
          },
        },
      )
    }
  })
}
