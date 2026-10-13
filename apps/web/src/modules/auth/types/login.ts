export type LoginFormProps = {
  callbackUrl: string
}

export interface LoginErrorBody {
  error?: { code?: string }
}
