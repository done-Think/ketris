import {
  RegistrationEmailAlreadyInUseError,
  RenterTenantNotConfiguredError,
} from '../../domain/errors'
import { assertTermsAccepted, RENTER_TENANT_SLUG } from '../../domain/registration-policy'
import type { RegisterRenterInput } from '../../types/use-case-inputs'
import type { RegisterRenterOutput } from '../../types/use-case-outputs'
import type { RegistrationPasswordHasher } from '../ports/registration-password-hasher.port'
import type { RegistrationRepository } from '../ports/registration-repository.port'

export { RENTER_TENANT_SLUG } from '../../domain/registration-policy'

export class RegisterRenterUseCase {
  constructor(
    private readonly accounts: RegistrationRepository,
    private readonly passwords: RegistrationPasswordHasher,
  ) {}

  async execute(input: RegisterRenterInput): Promise<RegisterRenterOutput> {
    assertTermsAccepted(input.acceptTerms)
    const tenant = await this.accounts.findTenantBySlug(RENTER_TENANT_SLUG)
    if (!tenant) throw new RenterTenantNotConfiguredError()
    if (await this.accounts.findAccountByEmail(tenant.id, input.email))
      throw new RegistrationEmailAlreadyInUseError()
    const user = await this.accounts.createMember({
      tenantId: tenant.id,
      nome: input.fullName,
      email: input.email,
      senhaHash: await this.passwords.hash(input.password),
      papel: 'RENTER',
      pendingApproval: false,
      telefone: input.phone,
      termosAceitosEm: new Date(),
      createBrokerProfile: false,
    })
    return { email: user.email, tenantId: user.tenantId, pendingApproval: false }
  }
}
