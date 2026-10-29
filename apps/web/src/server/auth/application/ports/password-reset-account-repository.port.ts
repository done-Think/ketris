import type { ResetAccountPassword } from '../../types/password-reset'

export interface PasswordResetAccountRepository {
  resetPassword(input: ResetAccountPassword): Promise<boolean>
}
