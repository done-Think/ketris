import { BcryptPasswordHasher } from '@server/auth/infrastructure/bcrypt-password-hasher'

import { RegisterRenterUseCase } from './application/use-cases/register-renter.use-case'
import { RegisterTenantAgentUseCase } from './application/use-cases/register-tenant-agent.use-case'
import { RegisterTenantOwnerUseCase } from './application/use-cases/register-tenant-owner.use-case'
import { SearchRegisterableTenantsUseCase } from './application/use-cases/search-registerable-tenants.use-case'
import { PrismaRegistrationRepository } from './infrastructure/prisma-registration.repository'

const registrationRepository = new PrismaRegistrationRepository()
const passwordHasher = new BcryptPasswordHasher()

export const registrationContainer = {
  registerTenantOwnerUseCase: new RegisterTenantOwnerUseCase(
    registrationRepository,
    passwordHasher,
  ),
  registerTenantAgentUseCase: new RegisterTenantAgentUseCase(
    registrationRepository,
    passwordHasher,
  ),
  registerRenterUseCase: new RegisterRenterUseCase(registrationRepository, passwordHasher),
  searchRegisterableTenantsUseCase: new SearchRegisterableTenantsUseCase(registrationRepository),
}
