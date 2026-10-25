export interface NewRefreshToken {
  userId: string
  tenantId: string
  tokenHash: string
  expiresAt: Date
}

export interface StoredRefreshToken {
  id: string
  userId: string
  tenantId: string
}

export interface RefreshTokenRotation {
  previous: StoredRefreshToken
  replacement: NewRefreshToken
  expectedSessionVersion: number
}

export interface RefreshTokenAccountState {
  active: boolean
  sessionVersion: number
}

export interface RefreshTokenRepository {
  create(input: NewRefreshToken): Promise<void>
  rotate(input: RefreshTokenRotation): Promise<boolean>
  findValidByTokenHash(tokenHash: string): Promise<StoredRefreshToken | null>
  revokeById(id: string): Promise<void>
  revokeAllForUser(userId: string): Promise<void>
}
