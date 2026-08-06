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

export interface RefreshTokenRepository {
  create(input: NewRefreshToken): Promise<void>
  findValidByTokenHash(tokenHash: string): Promise<StoredRefreshToken | null>
  revokeById(id: string): Promise<void>
  revokeAllForUser(userId: string): Promise<void>
}
