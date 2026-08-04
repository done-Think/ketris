import type { AuthenticatedPlatformAdmin } from '../../domain/platform-admin.entity'

export interface PlatformAccessTokenPayload {
  sub: string
  scope: 'platform'
}

export interface PlatformTokenService {
  sign(admin: AuthenticatedPlatformAdmin): Promise<string>
  verify(token: string): Promise<PlatformAccessTokenPayload>
}
