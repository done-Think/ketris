import {
  accountTypeForProfile,
  SELF_REGISTERED_TENANT_STATUS,
} from '../../domain/tenant-owner-profile'
import { assertTermsAccepted } from '../../domain/registration-policy'
import type { RegisterTenantOwnerInput } from '../../types/use-case-inputs'
import type { RegisterTenantOwnerOutput } from '../../types/use-case-outputs'
import type { RegistrationPasswordHasher } from '../ports/registration-password-hasher.port'
import type { RegistrationRepository } from '../ports/registration-repository.port'

export class RegisterTenantOwnerUseCase {
  constructor(
    private readonly accounts: RegistrationRepository,
    private readonly passwords: RegistrationPasswordHasher,
  ) {}

  async execute(input: RegisterTenantOwnerInput): Promise<RegisterTenantOwnerOutput> {
    assertTermsAccepted(input.acceptTerms)
    const passwordHash = await this.passwords.hash(input.password)
    const { user } = await this.accounts.createTenantWithAdmin({
      tenantName: input.companyName?.trim() || input.fullName,
      adminName: input.fullName,
      email: input.email,
      passwordHash,
      accountType: accountTypeForProfile(input.profile),
      status: SELF_REGISTERED_TENANT_STATUS,
      phone: input.phone,
      creci: input.creci,
      termsAcceptedAt: new Date(),
      createBrokerProfile: input.profile === 'broker',
    })
    return { email: user.email, tenantId: user.tenantId, pendingApproval: false }
  }
}
