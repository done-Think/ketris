import type {
  NewPlatformRefreshToken,
  PlatformRefreshTokenRotation,
  StoredPlatformRefreshToken,
} from '../../types/platform-refresh-token-repository'

export interface PlatformRefreshTokenRepository {
  create(input: NewPlatformRefreshToken): Promise<void>
  rotate(input: PlatformRefreshTokenRotation): Promise<boolean>
  findValidByTokenHash(tokenHash: string): Promise<StoredPlatformRefreshToken | null>
  revokeById(id: string): Promise<void>
  revokeAllForPlatformAdmin(platformAdminId: string): Promise<void>
}
