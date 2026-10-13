import { BaseService } from '@shared/lib/api/base-service'
import type { AppLocale } from '@/i18n/types/locale.types'

class PasswordRecoveryService extends BaseService {
  private readonly path = '/auth'

  requestCode(email: string, locale: AppLocale): Promise<void> {
    return this.http.post<void>(
      `${this.path}/password-reset-codes`,
      { email, locale },
      { skipUnauthorizedHandling: true },
    )
  }

  verifyCode(email: string, code: string): Promise<string> {
    return this.http
      .post<{ resetToken: string }>(
        `${this.path}/password-reset-codes/verify`,
        { email, code },
        { skipUnauthorizedHandling: true },
      )
      .then((data) => data.resetToken)
  }

  resetPassword(input: { email: string; password: string; resetToken: string }): Promise<void> {
    return this.http.post<void>(`${this.path}/reset-password`, input, {
      skipUnauthorizedHandling: true,
    })
  }
}

export const passwordRecoveryService = new PasswordRecoveryService()
