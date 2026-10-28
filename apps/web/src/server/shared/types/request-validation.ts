export type ValidationParameter =
  string | number | boolean | null | ValidationParameter[] | { [key: string]: ValidationParameter }

export type RequestValidationIssue = {
  path: string
  message: string
  code?: string
  params?: Record<string, ValidationParameter>
}
