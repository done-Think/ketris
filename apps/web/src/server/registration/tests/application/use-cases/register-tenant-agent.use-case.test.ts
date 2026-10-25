import { describe, expect, it, vi } from 'vitest'

import { RegisterTenantAgentUseCase } from '../../../application/use-cases/register-tenant-agent.use-case'
import {
  AgencyNotFoundError,
  RegistrationEmailAlreadyInUseError,
  TermsAcceptanceRequiredError,
} from '../../../domain/errors'
import { account, createDeps, details, tenant } from './fixtures'

const input = { ...details, agencyId: tenant.id, creci: 'CRECI-123' }

describe('RegisterTenantAgentUseCase', () => {
  it.each(['ACTIVE', 'TRIAL'] as const)(
    'registers a pending agent with a draft broker profile in an %s agency',
    async (status) => {
      const { accounts, passwords } = createDeps()
      vi.mocked(accounts.findTenantById).mockResolvedValueOnce({ ...tenant, status })
      const result = await new RegisterTenantAgentUseCase(accounts, passwords).execute(input)
      expect(accounts.findAccountByEmail).toHaveBeenCalledWith(tenant.id, details.email)
      expect(accounts.createMember).toHaveBeenCalledWith({
        tenantId: tenant.id,
        nome: details.fullName,
        email: details.email,
        senhaHash: 'test-hash',
        papel: 'AGENT',
        pendingApproval: true,
        telefone: details.phone,
        creci: input.creci,
        termosAceitosEm: expect.any(Date),
        createBrokerProfile: true,
      })
      expect(result).toEqual({ email: account.email, tenantId: tenant.id, pendingApproval: true })
    },
  )

  it.each([
    null,
    { ...tenant, accountType: 'INDIVIDUAL' as const },
    { ...tenant, accountType: 'BROKER' as const },
    { ...tenant, status: 'SUSPENDED' as const },
    { ...tenant, status: 'CANCELED' as const },
  ])('rejects missing or unavailable agencies before creating a membership', async (agency) => {
    const { accounts, passwords } = createDeps()
    vi.mocked(accounts.findTenantById).mockResolvedValueOnce(agency)
    await expect(
      new RegisterTenantAgentUseCase(accounts, passwords).execute(input),
    ).rejects.toThrow(AgencyNotFoundError)
    expect(accounts.createMember).not.toHaveBeenCalled()
    expect(passwords.hash).not.toHaveBeenCalled()
  })

  it('rejects an existing account within the chosen tenant', async () => {
    const { accounts, passwords } = createDeps()
    vi.mocked(accounts.findAccountByEmail).mockResolvedValueOnce(account)
    await expect(
      new RegisterTenantAgentUseCase(accounts, passwords).execute(input),
    ).rejects.toThrow(RegistrationEmailAlreadyInUseError)
    expect(accounts.createMember).not.toHaveBeenCalled()
  })

  it('requires terms acceptance before loading or mutating accounts', async () => {
    const { accounts, passwords } = createDeps()
    await expect(
      new RegisterTenantAgentUseCase(accounts, passwords).execute({ ...input, acceptTerms: false }),
    ).rejects.toThrow(TermsAcceptanceRequiredError)
    expect(accounts.findTenantById).not.toHaveBeenCalled()
    expect(accounts.createMember).not.toHaveBeenCalled()
  })
})
