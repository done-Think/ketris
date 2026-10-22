import { BcryptPasswordHasher } from '@server/auth/infrastructure/bcrypt-password-hasher'
import { PrismaUserRepository } from '@server/auth/infrastructure/prisma-user.repository'

import { CreatePlatformAdminUseCase } from './application/use-cases/create-platform-admin.use-case'
import { CreateTenantAdminUseCase } from './application/use-cases/create-tenant-admin.use-case'
import { CreateTenantUseCase } from './application/use-cases/create-tenant.use-case'
import { DeactivatePlatformAdminUseCase } from './application/use-cases/deactivate-platform-admin.use-case'
import { GetPlatformAdminUseCase } from './application/use-cases/get-platform-admin.use-case'
import { GetPlatformFinanceUseCase } from './application/use-cases/get-platform-finance.use-case'
import { GetPlatformOverviewUseCase } from './application/use-cases/get-platform-overview.use-case'
import { GetSystemHealthUseCase } from './application/use-cases/get-system-health.use-case'
import { ListPlatformAdminsUseCase } from './application/use-cases/list-platform-admins.use-case'
import { ListTenantUsersUseCase } from './application/use-cases/list-tenant-users.use-case'
import { ListPlatformPlansUseCase } from './application/use-cases/list-platform-plans.use-case'
import { ListTenantsUseCase } from './application/use-cases/list-tenants.use-case'
import { LoginPlatformAdminUseCase } from './application/use-cases/login-platform-admin.use-case'
import { RefreshPlatformAdminTokenUseCase } from './application/use-cases/refresh-platform-admin-token.use-case'
import { UpdatePlatformAdminUseCase } from './application/use-cases/update-platform-admin.use-case'
import { UpdatePlatformPlanUseCase } from './application/use-cases/update-platform-plan.use-case'
import { UpdateTenantAccountUseCase } from './application/use-cases/update-tenant-account.use-case'
import { JosePlatformTokenService } from './infrastructure/jose-platform-token.service'
import { PrismaDatabaseHealthProbe } from './infrastructure/prisma-database-health.probe'
import { PrismaPlatformAdminRepository } from './infrastructure/prisma-platform-admin.repository'
import { PrismaPlatformOverviewRepository } from './infrastructure/prisma-platform-overview.repository'
import { PrismaPlatformRefreshTokenRepository } from './infrastructure/prisma-platform-refresh-token.repository'
import { PrismaPlatformPlanRepository } from './infrastructure/prisma-platform-plan.repository'
import { PrismaPlatformTenantRepository } from './infrastructure/prisma-platform-tenant.repository'
import { PrismaTenantRepository } from './infrastructure/prisma-tenant.repository'
import { SentryErrorTrackingProvider } from './infrastructure/sentry-error-tracking.provider'

const platformAdminRepository = new PrismaPlatformAdminRepository()
const passwordHasher = new BcryptPasswordHasher()
const tokenService = new JosePlatformTokenService()
const refreshTokenRepository = new PrismaPlatformRefreshTokenRepository()
const tenantRepository = new PrismaTenantRepository()
const platformTenantRepository = new PrismaPlatformTenantRepository()
const platformPlanRepository = new PrismaPlatformPlanRepository()
const userRepository = new PrismaUserRepository()
const platformOverviewRepository = new PrismaPlatformOverviewRepository()

export const platformContainer = {
  tokenService,
  platformAdminRepository,
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
  listTenantsUseCase: new ListTenantsUseCase(platformTenantRepository, platformPlanRepository),
  listPlatformPlansUseCase: new ListPlatformPlansUseCase(
    platformPlanRepository,
    platformTenantRepository,
  ),
  updatePlatformPlanUseCase: new UpdatePlatformPlanUseCase(platformPlanRepository),
  getPlatformFinanceUseCase: new GetPlatformFinanceUseCase(
    platformTenantRepository,
    platformPlanRepository,
  ),
  updateTenantAccountUseCase: new UpdateTenantAccountUseCase(platformTenantRepository),
  createTenantUseCase: new CreateTenantUseCase(tenantRepository),
  listTenantUsersUseCase: new ListTenantUsersUseCase(tenantRepository, userRepository),
  createTenantAdminUseCase: new CreateTenantAdminUseCase(
    tenantRepository,
    userRepository,
    passwordHasher,
  ),
  getPlatformOverviewUseCase: new GetPlatformOverviewUseCase(
    platformOverviewRepository,
    platformTenantRepository,
    platformPlanRepository,
  ),
  getSystemHealthUseCase: new GetSystemHealthUseCase(
    new PrismaDatabaseHealthProbe(),
    new SentryErrorTrackingProvider(),
  ),
}
