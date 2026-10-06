import { BaseService } from '@shared/lib/api/base-service'

class PasswordRecoveryService extends BaseService {
  private readonly path = '/auth'

  requestCode(email: string): Promise<void> {
    return this.http.post<void>(`${this.path}/password-reset-codes`, { email })
  }

  verifyCode(email: string, code: string): Promise<string> {
    return this.http
      .post<{ resetToken: string }>(`${this.path}/password-reset-codes/verify`, { email, code })
      .then((data) => data.resetToken)
  }

  resetPassword(input: { email: string; password: string; resetToken: string }): Promise<void> {
    return this.http.post<void>(`${this.path}/reset-password`, input)
  }
}

export const passwordRecoveryService = new PasswordRecoveryService()
