export interface NewEmailOwnershipCode {
  email: string
  codeHash: string
  expiresAt: Date
}

export interface VerifyEmailOwnershipCode {
  email: string
  codeHash: string
  consume: boolean
}

export interface PasswordResetClaims {
  userId: string
  sessionVersion: number
}

export interface ResetAccountPassword {
  userId: string
  tenantId: string
  email: string
  sessionVersion: number
  passwordHash: string
}
