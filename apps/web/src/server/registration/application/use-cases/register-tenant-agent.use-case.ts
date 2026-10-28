import { RegistrationEmailAlreadyInUseError } from '../../domain/errors'
import {
  assertAgencyCanReceiveMembers,
  assertTermsAccepted,
} from '../../domain/registration-policy'
import type { RegisterTenantAgentInput } from '../../types/use-case-inputs'
import type { RegisterTenantAgentOutput } from '../../types/use-case-outputs'
import type { RegistrationPasswordHasher } from '../ports/registration-password-hasher.port'
import type { RegistrationRepository } from '../ports/registration-repository.port'

export class RegisterTenantAgentUseCase {
  constructor(
    private readonly accounts: RegistrationRepository,
    private readonly passwords: RegistrationPasswordHasher,
  ) {}

  async execute(input: RegisterTenantAgentInput): Promise<RegisterTenantAgentOutput> {
    assertTermsAccepted(input.acceptTerms)
    const agency = await this.accounts.findTenantById(input.agencyId)
    assertAgencyCanReceiveMembers(agency)
    if (await this.accounts.findAccountByEmail(agency.id, input.email))
      throw new RegistrationEmailAlreadyInUseError()
    const user = await this.accounts.createMember({
      tenantId: agency.id,
      name: input.fullName,
      email: input.email,
      passwordHash: await this.passwords.hash(input.password),
      role: 'AGENT',
      pendingApproval: true,
      phone: input.phone,
      creci: input.creci,
      termsAcceptedAt: new Date(),
      createBrokerProfile: true,
    })
    return { email: user.email, tenantId: user.tenantId, pendingApproval: true }
  }
}
