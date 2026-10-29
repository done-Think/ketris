import { BaseService } from '@shared/lib/api/base-service'
import type { ResetPasswordInput, VerifyRecoveryResponse } from '../types/password-recovery'
import type { AppLocale } from '@/i18n/types/locale.types'

export class PasswordRecoveryService extends BaseService {
  private readonly path = '/auth'

  requestCode(email: string, locale: AppLocale): Promise<void> {
    return this.http.post<void>(
      `${this.path}/password-reset-codes`,
      { email, locale },
      { skipUnauthorizedHandling: true },
    )
  }

  verifyCode(email: string, code: string, tenantId?: string): Promise<VerifyRecoveryResponse> {
    return this.http.post<VerifyRecoveryResponse>(
      `${this.path}/password-reset-codes/verify`,
      { email, code, ...(tenantId ? { tenantId } : {}) },
      { skipUnauthorizedHandling: true },
    )
  }

  resetPassword(input: ResetPasswordInput): Promise<void> {
    return this.http.post<void>(`${this.path}/reset-password`, input, {
      skipUnauthorizedHandling: true,
    })
  }
}

export const passwordRecoveryService = new PasswordRecoveryService()
