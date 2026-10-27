export interface NewPlatformRefreshToken {
  platformAdminId: string
  tokenHash: string
  expiresAt: Date
}

export interface StoredPlatformRefreshToken {
  id: string
  platformAdminId: string
}

export interface PlatformRefreshTokenRotation {
  previous: StoredPlatformRefreshToken
  replacement: NewPlatformRefreshToken
}
