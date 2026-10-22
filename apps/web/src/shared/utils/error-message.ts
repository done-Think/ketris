import axios from 'axios'

export function getApiErrorCode(error: unknown): string | undefined {
  if (!axios.isAxiosError(error)) return undefined

  const code = error.response?.data?.error?.code

  return typeof code === 'string' ? code : undefined
}

export function extractErrorMessage(
  error: unknown,
  fallback: string,
  messagesByCode: Record<string, string> = {},
): string {
  const code = getApiErrorCode(error)

  return (code && messagesByCode[code]) || fallback
}
