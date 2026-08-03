import type { AuthenticatedUser } from '../../domain/user.entity'

export interface AccessTokenPayload {
  sub: string // userId
  tenantId: string
  papel: string
}

// Port — assinatura/verificação do access token usado pelo HttpClient do frontend (Bearer) e,
// futuramente, pelo guard de sessão dos demais Route Handlers (specs/002.../tasks.md, T015).
export interface TokenService {
  sign(user: AuthenticatedUser): Promise<string>
  verify(token: string): Promise<AccessTokenPayload>
}
