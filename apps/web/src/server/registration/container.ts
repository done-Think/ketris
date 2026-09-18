import { BcryptPasswordHasher } from '@server/auth/infrastructure/bcrypt-password-hasher'
import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { PrismaRefreshTokenRepository } from '@server/auth/infrastructure/prisma-refresh-token.repository'
import { PrismaUserRepository } from '@server/auth/infrastructure/prisma-user.repository'
import { PrismaTenantRepository } from '@server/platform/infrastructure/prisma-tenant.repository'

import { RegisterRenterUseCase } from './application/use-cases/register-renter.use-case'
import { RegisterTenantAgentUseCase } from './application/use-cases/register-tenant-agent.use-case'
import { RegisterTenantOwnerUseCase } from './application/use-cases/register-tenant-owner.use-case'
import { SearchRegisterableTenantsUseCase } from './application/use-cases/search-registerable-tenants.use-case'
import { PrismaRegistrationRepository } from './infrastructure/prisma-registration.repository'

const registrationRepository = new PrismaRegistrationRepository()
const tenantRepository = new PrismaTenantRepository()
const userRepository = new PrismaUserRepository()
const passwordHasher = new BcryptPasswordHasher()
const tokenService = new JoseTokenService()
const refreshTokenRepository = new PrismaRefreshTokenRepository()

export const registrationContainer = {
  registerTenantOwnerUseCase: new RegisterTenantOwnerUseCase(
    registrationRepository,
    passwordHasher,
    tokenService,
    refreshTokenRepository,
  ),
  registerTenantAgentUseCase: new RegisterTenantAgentUseCase(
    tenantRepository,
    userRepository,
    passwordHasher,
  ),
  registerRenterUseCase: new RegisterRenterUseCase(
    tenantRepository,
    userRepository,
    passwordHasher,
    tokenService,
    refreshTokenRepository,
  ),
  searchRegisterableTenantsUseCase: new SearchRegisterableTenantsUseCase(tenantRepository),
}
