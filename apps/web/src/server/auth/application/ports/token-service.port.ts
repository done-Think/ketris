import type { UserRole } from '../../domain/user.entity'
import type { AuthenticatedUser } from '../../types/authenticated-user'

export interface AccessTokenPayload {
  sub: string
  tenantId: string
  role: UserRole
  sessionVersion?: number
}

export interface TokenService {
  sign(user: AuthenticatedUser): Promise<string>
  verify(token: string): Promise<AccessTokenPayload>
}
