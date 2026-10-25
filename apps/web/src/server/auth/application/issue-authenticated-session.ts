import { assertUserCanAuthenticate } from '../domain/user-access-policy'
import {
  generateRefreshToken,
  hashRefreshToken,
  refreshTokenExpiryDate,
} from '../domain/refresh-token'
import { toAuthenticatedUser } from '../domain/user.entity'
import type { User } from '../domain/user.entity'
import type { LoginOutput } from '../types/use-case-outputs'
import type { RefreshTokenRepository } from './ports/refresh-token-repository.port'
import type { TokenService } from './ports/token-service.port'

export async function issueAuthenticatedSession(
  user: User,
  tokens: TokenService,
  refreshTokens: RefreshTokenRepository,
): Promise<LoginOutput> {
  assertUserCanAuthenticate(user)
  const authenticatedUser = toAuthenticatedUser(user)
  const accessToken = await tokens.sign(authenticatedUser)
  const refreshToken = generateRefreshToken()
  await refreshTokens.create({
    userId: user.id,
    tenantId: user.tenantId,
    tokenHash: hashRefreshToken(refreshToken),
    expiresAt: refreshTokenExpiryDate(),
  })
  return { user: authenticatedUser, accessToken, refreshToken }
}
