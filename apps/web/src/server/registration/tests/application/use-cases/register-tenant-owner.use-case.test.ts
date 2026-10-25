import { describe, expect, it } from 'vitest'

import { RegisterTenantOwnerUseCase } from '../../../application/use-cases/register-tenant-owner.use-case'
import { TermsAcceptanceRequiredError } from '../../../domain/errors'
import { account, createDeps, details } from './fixtures'

describe('RegisterTenantOwnerUseCase', () => {
  it('creates the tenant owner with contact and acceptance metadata and waits for email confirmation', async () => {
    const { accounts, passwords } = createDeps()
    const result = await new RegisterTenantOwnerUseCase(accounts, passwords).execute({
      ...details,
      profile: 'imobiliaria',
      companyName: '  Imobiliária Nova  ',
    })
    expect(passwords.hash).toHaveBeenCalledWith(details.password)
    expect(accounts.createTenantWithAdmin).toHaveBeenCalledWith({
      tenantName: 'Imobiliária Nova',
      adminName: details.fullName,
      email: details.email,
      senhaHash: 'test-hash',
      accountType: 'AGENCY',
      status: 'TRIAL',
      telefone: details.phone,
      creci: undefined,
      termosAceitosEm: expect.any(Date),
      createBrokerProfile: false,
    })
    expect(result).toEqual({
      email: account.email,
      tenantId: account.tenantId,
      pendingApproval: false,
    })
  })

  it.each([
    ['proprietario', 'INDIVIDUAL'],
    ['corretor', 'BROKER'],
    ['imobiliaria', 'AGENCY'],
    ['construtora', 'AGENCY'],
  ] as const)('creates profile %s as %s in trial', async (profile, accountType) => {
    const { accounts, passwords } = createDeps()
    await new RegisterTenantOwnerUseCase(accounts, passwords).execute({
      ...details,
      profile,
      creci: 'CRECI-123',
    })
    expect(accounts.createTenantWithAdmin).toHaveBeenCalledWith(
      expect.objectContaining({
        accountType,
        status: 'TRIAL',
        creci: 'CRECI-123',
        createBrokerProfile: profile === 'corretor',
      }),
    )
  })

  it.each([undefined, '   '])(
    'uses the owner name when companyName is blank (%s)',
    async (companyName) => {
      const { accounts, passwords } = createDeps()
      await new RegisterTenantOwnerUseCase(accounts, passwords).execute({
        ...details,
        profile: 'corretor',
        companyName,
      })
      expect(accounts.createTenantWithAdmin).toHaveBeenCalledWith(
        expect.objectContaining({ tenantName: details.fullName }),
      )
    },
  )

  it('allows the same email in a newly created tenant without a global account lookup', async () => {
    const { accounts, passwords } = createDeps()
    await expect(
      new RegisterTenantOwnerUseCase(accounts, passwords).execute({
        ...details,
        profile: 'proprietario',
      }),
    ).resolves.toMatchObject({ email: account.email })
    expect(accounts.findAccountByEmail).not.toHaveBeenCalled()
  })

  it('requires terms acceptance before hashing or creating accounts', async () => {
    const { accounts, passwords } = createDeps()
    await expect(
      new RegisterTenantOwnerUseCase(accounts, passwords).execute({
        ...details,
        profile: 'proprietario',
        acceptTerms: false,
      }),
    ).rejects.toThrow(TermsAcceptanceRequiredError)
    expect(passwords.hash).not.toHaveBeenCalled()
    expect(accounts.createTenantWithAdmin).not.toHaveBeenCalled()
  })
})
