import { CreateAdminUseCase } from './application/use-cases/create-admin.use-case'
import { CreateUserUseCase } from './application/use-cases/create-user.use-case'
import { DeactivateUserUseCase } from './application/use-cases/deactivate-user.use-case'
import { GetUserUseCase } from './application/use-cases/get-user.use-case'
import { ListUsersUseCase } from './application/use-cases/list-users.use-case'
import { LoginUseCase } from './application/use-cases/login.use-case'
import { RefreshAccessTokenUseCase } from './application/use-cases/refresh-access-token.use-case'
import { UpdateUserUseCase } from './application/use-cases/update-user.use-case'
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
  createAdminUseCase: new CreateAdminUseCase(userRepository, passwordHasher),
  listUsersUseCase: new ListUsersUseCase(userRepository),
  getUserUseCase: new GetUserUseCase(userRepository),
  updateUserUseCase: new UpdateUserUseCase(userRepository),
  deactivateUserUseCase: new DeactivateUserUseCase(userRepository, refreshTokenRepository),
  refreshAccessTokenUseCase: new RefreshAccessTokenUseCase(
    userRepository,
    tokenService,
    refreshTokenRepository,
  ),
}
