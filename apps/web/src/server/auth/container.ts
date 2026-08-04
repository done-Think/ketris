import { CreateUserUseCase } from './application/use-cases/create-user.use-case'
import { LoginUseCase } from './application/use-cases/login.use-case'
import { RefreshAccessTokenUseCase } from './application/use-cases/refresh-access-token.use-case'
import { BcryptPasswordHasher } from './infrastructure/bcrypt-password-hasher'
import { JoseTokenService } from './infrastructure/jose-token.service'
import { PrismaRefreshTokenRepository } from './infrastructure/prisma-refresh-token.repository'
import { PrismaUserRepository } from './infrastructure/prisma-user.repository'

const userRepository = new PrismaUserRepository()
const passwordHasher = new BcryptPasswordHasher()
const tokenService = new JoseTokenService()
const refreshTokenRepository = new PrismaRefreshTokenRepository()

export const authContainer = {
  tokenService,
  loginUseCase: new LoginUseCase(
    userRepository,
    passwordHasher,
    tokenService,
    refreshTokenRepository,
  ),
  createUserUseCase: new CreateUserUseCase(userRepository, passwordHasher),
  refreshAccessTokenUseCase: new RefreshAccessTokenUseCase(
    userRepository,
    tokenService,
    refreshTokenRepository,
  ),
}
