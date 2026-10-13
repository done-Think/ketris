export interface PasswordResetTokenService {
  issue(userId: string): Promise<string>
  verify(token: string): Promise<string>
}
