import type { ApiErrorCode } from '../types/api.types'
import type { CaptureIssue } from '../types/session.types'

export class ApiError extends Error {
  readonly code: ApiErrorCode
  readonly status: number
  readonly reason: CaptureIssue | null
  readonly details: unknown

  constructor(
    code: ApiErrorCode,
    status: number,
    reason: CaptureIssue | null = null,
    message?: string,
    details?: unknown,
  ) {
    super(message || code)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.reason = reason
    this.details = details
  }
}

export function normalizeApiError(error: unknown, status = 0): ApiError {
  if (error instanceof ApiError) return error
  const outer = error as {
    response?: { status?: number; data?: unknown }
    error?: unknown
    code?: string
    message?: string
  }
  const data = (outer?.response?.data ?? outer) as {
    error?: unknown
    code?: string
    message?: string
  }
  const body = (data?.error ?? data) as {
    code?: ApiErrorCode
    message?: string
    reason?: CaptureIssue
    details?: { reason?: CaptureIssue }
  }
  return new ApiError(
    body?.code ?? (outer?.response ? 'UNKNOWN' : 'NETWORK_ERROR'),
    outer?.response?.status ?? status,
    body?.reason ?? body?.details?.reason ?? null,
    body?.message,
    body?.details,
  )
}
