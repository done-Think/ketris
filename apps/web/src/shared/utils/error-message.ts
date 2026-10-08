import axios from 'axios'

export function extractErrorMessage(
  error: unknown,
  fallback: string,
  messagesByCode: Record<string, string> = {},
): string {
  if (axios.isAxiosError(error)) {
    const code = error.response?.data?.error?.code
    if (typeof code === 'string' && messagesByCode[code]) return messagesByCode[code]
  }
  return fallback
}
