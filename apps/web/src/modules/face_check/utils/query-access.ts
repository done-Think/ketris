import { ApiError } from '../services/api-error'

export function hasLostFaceCheckAccess(error: unknown): boolean {
  return error instanceof ApiError && [401, 403, 404].includes(error.status)
}
