import { describe, expect, it, vi } from 'vitest'

import { RENTER_TENANT_SLUG } from '@server/shared/domain/system-tenants'

import { RegisterRenterUseCase } from '../../../application/use-cases/register-renter.use-case'
import {
  RegistrationEmailAlreadyInUseError,
  RenterTenantNotConfiguredError,
  TermsAcceptanceRequiredError,
} from '../../../domain/errors'
import { account, createDeps, details, tenant } from './fixtures'

describe('RegisterRenterUseCase', () => {
  it('creates a renter in the shared tenant and waits for email verification without issuing a session', async () => {
    const { accounts, passwords } = createDeps()
    const result = await new RegisterRenterUseCase(accounts, passwords).execute(details)
    expect(accounts.findTenantBySlug).toHaveBeenCalledWith(RENTER_TENANT_SLUG)
    expect(accounts.findAccountByEmail).toHaveBeenCalledWith(tenant.id, details.email)
    expect(accounts.createMember).toHaveBeenCalledWith({
      tenantId: tenant.id,
      name: details.fullName,
      email: details.email,
      passwordHash: 'test-hash',
      role: 'RENTER',
      pendingApproval: false,
      phone: details.phone,
      termsAcceptedAt: expect.any(Date),
      createBrokerProfile: false,
    })
    expect(result).toEqual({ email: account.email, tenantId: tenant.id, pendingApproval: false })
  })

  it('rejects missing shared-tenant configuration before creating a user', async () => {
    const { accounts, passwords } = createDeps()
    vi.mocked(accounts.findTenantBySlug).mockResolvedValueOnce(null)
    await expect(new RegisterRenterUseCase(accounts, passwords).execute(details)).rejects.toThrow(
      RenterTenantNotConfiguredError,
    )
    expect(accounts.createMember).not.toHaveBeenCalled()
  })

  it('rejects duplicate accounts within the shared tenant', async () => {
    const { accounts, passwords } = createDeps()
    vi.mocked(accounts.findAccountByEmail).mockResolvedValueOnce(account)
    await expect(new RegisterRenterUseCase(accounts, passwords).execute(details)).rejects.toThrow(
      RegistrationEmailAlreadyInUseError,
    )
    expect(accounts.createMember).not.toHaveBeenCalled()
  })

  it('requires terms acceptance before hashing or loading tenants', async () => {
    const { accounts, passwords } = createDeps()
    await expect(
      new RegisterRenterUseCase(accounts, passwords).execute({ ...details, acceptTerms: false }),
    ).rejects.toThrow(TermsAcceptanceRequiredError)
    expect(accounts.findTenantBySlug).not.toHaveBeenCalled()
    expect(passwords.hash).not.toHaveBeenCalled()
  })
})
