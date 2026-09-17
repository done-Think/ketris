import type { AuthenticatedUser } from '../../domain/user.entity'

export interface AccessTokenPayload {
  sub: string
  tenantId: string
  papel: string
}

export interface TokenService {
  sign(user: AuthenticatedUser): Promise<string>
  verify(token: string): Promise<AccessTokenPayload>
}
