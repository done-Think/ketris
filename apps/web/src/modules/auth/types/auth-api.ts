import type { LoginRequestInput, LoginResponseDTO } from '@server/auth/types/http'

export type AuthLoginPayload = LoginRequestInput
export type AuthLoginResponse = LoginResponseDTO
export type LoginTenantChoice = Extract<
  AuthLoginResponse,
  { outcome: 'SELECT_TENANT' }
>['tenants'][number]
