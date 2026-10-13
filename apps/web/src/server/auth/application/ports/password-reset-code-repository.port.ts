export interface NewPasswordResetCode {
  userId: string
  tenantId: string
  codeHash: string
  expiresAt: Date
}

export interface StoredPasswordResetCode {
  id: string
  userId: string
  codeHash: string
  attempts: number
  expiresAt: Date
}

export interface PasswordResetCodeRepository {
  create(input: NewPasswordResetCode): Promise<void>
  invalidateAllForUser(userId: string): Promise<void>
  findLatestActiveByUserId(userId: string): Promise<StoredPasswordResetCode | null>
  incrementAttempts(id: string): Promise<void>
  consume(id: string): Promise<void>
}
