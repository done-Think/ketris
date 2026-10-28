import type {
  RequestSignupVerificationDTO,
  ConfirmSignupVerificationDTO,
  ConfirmSignupVerificationResponseDTO,
} from '@shared/types/generated/auth/http'

import { BaseService } from '@shared/lib/api/base-service'

import type { AuthLoginPayload, AuthLoginResponse } from '../types/auth-api'

export class AuthService extends BaseService {
  requestSignupCode(input: RequestSignupVerificationDTO): Promise<void> {
    return this.http.post<void>('/auth/email-verification-codes', input, {
      skipUnauthorizedHandling: true,
    })
  }

  confirmSignupCode(
    input: ConfirmSignupVerificationDTO,
  ): Promise<ConfirmSignupVerificationResponseDTO> {
    return this.http.post<ConfirmSignupVerificationResponseDTO>(
      '/auth/email-verification-codes/verify',
      input,
      { skipUnauthorizedHandling: true },
    )
  }

  login(values: AuthLoginPayload): Promise<AuthLoginResponse> {
    return this.http.post<AuthLoginResponse>(
      '/auth/login',
      {
        email: values.email,
        password: values.password,
        ...(values.locale ? { locale: values.locale } : {}),
        ...(values.tenantId ? { tenantId: values.tenantId } : {}),
      },
      { skipUnauthorizedHandling: true },
    )
  }
}

export const authService = new AuthService()
