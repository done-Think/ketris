import { LoginUseCase } from './application/use-cases/login.use-case'
import { BcryptPasswordHasher } from './infrastructure/bcrypt-password-hasher'
import { JoseTokenService } from './infrastructure/jose-token.service'
import { PrismaUserRepository } from './infrastructure/prisma-user.repository'

export const authContainer = {
  loginUseCase: new LoginUseCase(
    new PrismaUserRepository(),
    new BcryptPasswordHasher(),
    new JoseTokenService(),
  ),
}
