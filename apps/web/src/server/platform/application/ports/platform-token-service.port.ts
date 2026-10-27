import type { PlatformAdminIdentity } from '../../types/platform-admin'
import type { PlatformAccessTokenPayload } from '../../types/platform-token-service'

export interface PlatformTokenService {
  sign(admin: PlatformAdminIdentity): Promise<string>
  verify(token: string): Promise<PlatformAccessTokenPayload>
}
