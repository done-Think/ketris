import { CreateUserUseCase } from './application/use-cases/create-user.use-case'
import { LoginUseCase } from './application/use-cases/login.use-case'
import { BcryptPasswordHasher } from './infrastructure/bcrypt-password-hasher'
import { JoseTokenService } from './infrastructure/jose-token.service'
import { PrismaUserRepository } from './infrastructure/prisma-user.repository'

const userRepository = new PrismaUserRepository()
const passwordHasher = new BcryptPasswordHasher()
const tokenService = new JoseTokenService()

export const authContainer = {
  tokenService,
  loginUseCase: new LoginUseCase(userRepository, passwordHasher, tokenService),
  createUserUseCase: new CreateUserUseCase(userRepository, passwordHasher),
}
