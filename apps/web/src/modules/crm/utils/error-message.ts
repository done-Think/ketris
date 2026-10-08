import { extractErrorMessage } from '@shared/utils/error-message'

export function errorMessage(
  error: unknown,
  fallback: string,
  messagesByCode?: Record<string, string>,
): string {
  return extractErrorMessage(error, fallback, messagesByCode)
}
