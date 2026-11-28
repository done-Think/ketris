export interface FailureReport {
  module: string
  operation: string
  error: unknown
}

export interface FailureReporter {
  report(failure: FailureReport): void
}
