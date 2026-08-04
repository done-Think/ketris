import { BcryptPasswordHasher } from '@server/auth/infrastructure/bcrypt-password-hasher'
import { PrismaUserRepository } from '@server/auth/infrastructure/prisma-user.repository'

import { BootstrapPlatformAdminUseCase } from './application/use-cases/bootstrap-platform-admin.use-case'
import { CreatePlatformAdminUseCase } from './application/use-cases/create-platform-admin.use-case'
import { CreateTenantAdminUseCase } from './application/use-cases/create-tenant-admin.use-case'
import { CreateTenantUseCase } from './application/use-cases/create-tenant.use-case'
import { DeactivatePlatformAdminUseCase } from './application/use-cases/deactivate-platform-admin.use-case'
import { GetPlatformAdminUseCase } from './application/use-cases/get-platform-admin.use-case'
import { ListPlatformAdminsUseCase } from './application/use-cases/list-platform-admins.use-case'
import { ListTenantUsersUseCase } from './application/use-cases/list-tenant-users.use-case'
import { ListTenantsUseCase } from './application/use-cases/list-tenants.use-case'
import { LoginPlatformAdminUseCase } from './application/use-cases/login-platform-admin.use-case'
import { RefreshPlatformAdminTokenUseCase } from './application/use-cases/refresh-platform-admin-token.use-case'
import { UpdatePlatformAdminUseCase } from './application/use-cases/update-platform-admin.use-case'
import { JosePlatformTokenService } from './infrastructure/jose-platform-token.service'
import { PrismaPlatformAdminRepository } from './infrastructure/prisma-platform-admin.repository'
import { PrismaPlatformBootstrapRepository } from './infrastructure/prisma-platform-bootstrap.repository'
import { PrismaPlatformRefreshTokenRepository } from './infrastructure/prisma-platform-refresh-token.repository'
import { PrismaTenantRepository } from './infrastructure/prisma-tenant.repository'

const platformAdminRepository = new PrismaPlatformAdminRepository()
const passwordHasher = new BcryptPasswordHasher()
const tokenService = new JosePlatformTokenService()
const refreshTokenRepository = new PrismaPlatformRefreshTokenRepository()
const bootstrapRepository = new PrismaPlatformBootstrapRepository()
const tenantRepository = new PrismaTenantRepository()
const userRepository = new PrismaUserRepository()

export const platformContainer = {
  tokenService,
  bootstrapPlatformAdminUseCase: new BootstrapPlatformAdminUseCase(
    bootstrapRepository,
    passwordHasher,
  ),
  loginPlatformAdminUseCase: new LoginPlatformAdminUseCase(
    platformAdminRepository,
    passwordHasher,
    tokenService,
    refreshTokenRepository,
  ),
  refreshPlatformAdminTokenUseCase: new RefreshPlatformAdminTokenUseCase(
    platformAdminRepository,
    tokenService,
    refreshTokenRepository,
  ),
  createPlatformAdminUseCase: new CreatePlatformAdminUseCase(
    platformAdminRepository,
    passwordHasher,
  ),
  listPlatformAdminsUseCase: new ListPlatformAdminsUseCase(platformAdminRepository),
  getPlatformAdminUseCase: new GetPlatformAdminUseCase(platformAdminRepository),
  updatePlatformAdminUseCase: new UpdatePlatformAdminUseCase(platformAdminRepository),
  deactivatePlatformAdminUseCase: new DeactivatePlatformAdminUseCase(
    platformAdminRepository,
    refreshTokenRepository,
  ),
  listTenantsUseCase: new ListTenantsUseCase(tenantRepository),
  createTenantUseCase: new CreateTenantUseCase(tenantRepository),
  listTenantUsersUseCase: new ListTenantUsersUseCase(tenantRepository, userRepository),
  createTenantAdminUseCase: new CreateTenantAdminUseCase(
    tenantRepository,
    userRepository,
    passwordHasher,
  ),
}
