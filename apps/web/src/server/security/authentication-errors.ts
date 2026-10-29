import { errors as joseErrors } from 'jose'
import { ZodError } from 'zod'

import { AppError } from '@server/shared/errors'

export function isAuthenticationError(error: unknown): boolean {
  return (
    (error instanceof AppError && (error.status === 401 || error.status === 403)) ||
    error instanceof joseErrors.JOSEError ||
    error instanceof ZodError
  )
}
