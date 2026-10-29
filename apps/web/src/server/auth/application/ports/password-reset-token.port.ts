import type { PasswordResetClaims } from '../../types/password-reset'

export interface PasswordResetTokenService {
  issue(userId: string, sessionVersion: number): Promise<string>
  verify(token: string): Promise<PasswordResetClaims>
}
