import { ApiError } from '../services/api-error'
import type { ApiErrorCode } from '../types/api.types'

export function extractErrorCode(error: unknown): ApiErrorCode {
  return error instanceof ApiError ? error.code : 'UNKNOWN'
}
