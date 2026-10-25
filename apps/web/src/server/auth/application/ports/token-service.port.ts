import type { AuthenticatedUser, Papel } from '../../domain/user.entity'

export interface AccessTokenPayload {
  sub: string
  tenantId: string
  papel: Papel
  sessionVersion?: number
}

export interface TokenService {
  sign(user: AuthenticatedUser): Promise<string>
  verify(token: string): Promise<AccessTokenPayload>
}
