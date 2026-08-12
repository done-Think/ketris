export interface NewPlatformRefreshToken {
  platformAdminId: string
  tokenHash: string
  expiresAt: Date
}

export interface StoredPlatformRefreshToken {
  id: string
  platformAdminId: string
}

export interface PlatformRefreshTokenRepository {
  create(input: NewPlatformRefreshToken): Promise<void>
  findValidByTokenHash(tokenHash: string): Promise<StoredPlatformRefreshToken | null>
  revokeById(id: string): Promise<void>
  revokeAllForPlatformAdmin(platformAdminId: string): Promise<void>
}
