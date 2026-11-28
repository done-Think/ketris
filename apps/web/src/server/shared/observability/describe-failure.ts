export interface FailureDescription {
  name: string
  code: string
}

function readCode(error: object): string {
  const record = error as Record<string, unknown>
  const direct = record.code ?? record.Code
  if (typeof direct === 'string' || typeof direct === 'number') return String(direct)
  const metadata = record.$metadata
  if (metadata && typeof metadata === 'object') {
    const status = (metadata as Record<string, unknown>).httpStatusCode
    if (typeof status === 'number') return String(status)
  }
  return 'none'
}

export function describeFailure(error: unknown): FailureDescription {
  if (error instanceof Error) return { name: error.name, code: readCode(error) }
  return { name: 'UnknownError', code: 'none' }
}
