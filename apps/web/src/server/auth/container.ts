import { LoginUseCase } from './application/use-cases/login.use-case'
import { BcryptPasswordHasher } from './infrastructure/bcrypt-password-hasher'
import { JoseTokenService } from './infrastructure/jose-token.service'
import { PrismaUserRepository } from './infrastructure/prisma-user.repository'

// Composition root do domínio `auth` — a "injeção de dependência" do projeto: monta manualmente as
// implementações concretas (infrastructure) e as passa para os use-cases (application), que só
// conhecem os ports. Route Handlers e o NextAuth importam só `authContainer`, nunca as classes de
// infraestrutura diretamente (ver ADR-0002).
export const authContainer = {
  loginUseCase: new LoginUseCase(
    new PrismaUserRepository(),
    new BcryptPasswordHasher(),
    new JoseTokenService(),
  ),
}
