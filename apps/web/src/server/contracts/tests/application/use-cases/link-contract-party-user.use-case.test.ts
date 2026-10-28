import type { ContractPartyLinkTransaction } from '../../../application/ports/contract-party-link-transaction.port'
import { describe, expect, it, vi } from 'vitest'
import type { User } from '@server/auth/domain/user.entity'
import type { Contract } from '../../../domain/contract.entity'
import { LinkContractPartyUserUseCase } from '../../../application/use-cases/link-contract-party-user.use-case'

const party = {
  id: 'party-1',
  userId: null,
  role: 'RENTER' as const,
  name: 'Maria',
  cpf: '11111111111',
  email: 'Maria@example.com',
  phone: null,
  signatureMethod: null,
  signatureDocumentId: null,
  signatureDocumentHash: null,
  createdAt: null,
  updatedAt: null,
  signatureStatus: 'PENDING' as const,
  signedAt: null,
  signedBy: null,
}

const contract: Contract = {
  id: 'contract-1',
  dataRevision: 0,
  createdBy: null,
  cancelledAt: null,
  cancelledBy: null,
  cancellationReason: null,
  closedAt: null,
  closedBy: null,
  closingReason: null,
  tenantId: 'agency-1',
  propertyId: 'property-1',
  property: { title: 'Apartamento', address: 'Rua do contrato' },
  opportunityId: 'opportunity-1',
  code: 'CTR-1',
  type: 'RESIDENTIAL',
  amount: 1000,
  dueDay: 5,
  startDate: new Date(),
  endDate: new Date(),
  adjustmentIndex: 'IPCA',
  guaranteeType: 'DEPOSIT',
  notes: null,
  status: 'ACTIVE',
  activatedAt: null,
  activatedBy: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  parties: [party],
  documents: [],
}

const renter: User = {
  id: 'renter-1',
  tenantId: 'shared-renter-tenant',
  name: 'Maria',
  email: 'maria@example.com',
  passwordHash: 'hash',
  role: 'RENTER',
  active: true,
  membershipApprovedAt: new Date(),
}

const input = {
  actorTenantId: 'agency-1',
  actorId: 'manager-1',
  actorRole: 'OWNER' as const,
  contractId: 'contract-1',
  partyId: 'party-1',
  email: ' MARIA@example.com ',
}

function setup(foundContract: Contract | null = contract, foundUser: User | null = renter) {
  const contracts = {
    findById: vi.fn().mockResolvedValue(foundContract),
    linkPartyUser: vi.fn().mockResolvedValue(true),
  }
  const users = {
    findManyByEmail: vi.fn().mockResolvedValue(foundUser ? [foundUser] : []),
    findById: vi.fn().mockResolvedValue(foundUser),
  }
  const transaction: ContractPartyLinkTransaction = { run: (work) => work({ contracts, users }) }
  return { contracts, users, useCase: new LinkContractPartyUserUseCase(transaction) }
}

describe('LinkContractPartyUserUseCase', () => {
  it.each(['RENTER', 'AGENT', 'PROPERTY_OWNER'] as const)(
    'rejects %s before looking up a contract or user',
    async (actorRole) => {
      const { contracts, users, useCase } = setup()
      await expect(useCase.execute({ ...input, actorRole })).rejects.toMatchObject({
        code: 'FORBIDDEN',
      })
      expect(contracts.findById).not.toHaveBeenCalled()
      expect(users.findManyByEmail).not.toHaveBeenCalled()
    },
  )

  it('does not look up users when the contract is outside the administrator tenant', async () => {
    const { contracts, users, useCase } = setup(null)
    await expect(useCase.execute(input)).rejects.toMatchObject({ code: 'CONTRACT_NOT_FOUND' })
    expect(contracts.findById).toHaveBeenCalledWith('contract-1', {
      kind: 'tenant',
      tenantId: 'agency-1',
    })
    expect(users.findManyByEmail).not.toHaveBeenCalled()
  })

  it.each(['LANDLORD', 'GUARANTOR'] as const)('does not link a %s party', async (role) => {
    const { contracts, users, useCase } = setup({ ...contract, parties: [{ ...party, role }] })
    await expect(useCase.execute(input)).rejects.toMatchObject({ code: 'CONTRACT_PARTY_NOT_FOUND' })
    expect(contracts.linkPartyUser).not.toHaveBeenCalled()
    expect(users.findManyByEmail).not.toHaveBeenCalled()
  })

  it('does not link a party from another contract', async () => {
    const { users, useCase } = setup()
    await expect(useCase.execute({ ...input, partyId: 'foreign-party' })).rejects.toMatchObject({
      code: 'CONTRACT_PARTY_NOT_FOUND',
    })
    expect(users.findManyByEmail).not.toHaveBeenCalled()
  })

  it('rejects an email different from the contract party email', async () => {
    const { users, useCase } = setup()
    await expect(useCase.execute({ ...input, email: 'other@example.com' })).rejects.toMatchObject({
      code: 'CONFLICT',
    })
    expect(users.findManyByEmail).not.toHaveBeenCalled()
  })

  it.each([null, { ...renter, active: false }, { ...renter, role: 'AGENT' as const }])(
    'rejects a missing, inactive or non-renter account',
    async (user) => {
      const { contracts, useCase } = setup(contract, user)
      await expect(useCase.execute(input)).rejects.toMatchObject({
        code: 'CONTRACT_RENTER_USER_NOT_FOUND',
      })
      expect(contracts.linkPartyUser).not.toHaveBeenCalled()
    },
  )

  it('links a shared-tenant renter after explicit agency administrator confirmation', async () => {
    const { contracts, users, useCase } = setup()
    await expect(useCase.execute(input)).resolves.toEqual({ partyId: party.id, userId: renter.id })
    expect(users.findManyByEmail).toHaveBeenCalledWith('maria@example.com')
    expect(contracts.linkPartyUser).toHaveBeenCalledWith({
      tenantId: 'agency-1',
      actorId: 'manager-1',
      contractId: 'contract-1',
      partyId: 'party-1',
      userId: 'renter-1',
      email: 'maria@example.com',
    })
  })

  it('allows repeating confirmation of the same link', async () => {
    const { useCase } = setup({ ...contract, parties: [{ ...party, userId: renter.id }] })
    await expect(useCase.execute(input)).resolves.toEqual({ partyId: party.id, userId: renter.id })
  })

  it('does not overwrite an existing link to another user', async () => {
    const { contracts, useCase } = setup({
      ...contract,
      parties: [{ ...party, userId: 'other-user' }],
    })
    await expect(useCase.execute(input)).rejects.toMatchObject({ code: 'CONFLICT' })
    expect(contracts.linkPartyUser).not.toHaveBeenCalled()
  })

  it('reports a concurrent change instead of claiming the link succeeded', async () => {
    const { contracts, useCase } = setup()
    contracts.linkPartyUser.mockResolvedValue(false)
    await expect(useCase.execute(input)).rejects.toMatchObject({ code: 'CONFLICT' })
  })
})

it('prioriza o locatário do tenant e ignora contas de outros papéis com o mesmo e-mail', async () => {
  const { users, contracts, useCase } = setup()
  users.findManyByEmail.mockResolvedValue([
    renter,
    { ...renter, id: 'local-renter', tenantId: input.actorTenantId },
    { ...renter, id: 'manager', role: 'OWNER' },
  ])
  await expect(useCase.execute(input)).resolves.toEqual({
    partyId: party.id,
    userId: 'local-renter',
  })
  expect(contracts.linkPartyUser).toHaveBeenCalledWith(
    expect.objectContaining({ userId: 'local-renter' }),
  )
})
it('recusa dois locatários elegíveis fora do tenant sem realizar a escrita', async () => {
  const { users, contracts, useCase } = setup()
  users.findManyByEmail.mockResolvedValue([
    renter,
    { ...renter, id: 'another', tenantId: 'another-tenant' },
  ])
  await expect(useCase.execute(input)).rejects.toMatchObject({ status: 409, code: 'CONFLICT' })
  expect(contracts.linkPartyUser).not.toHaveBeenCalled()
})
it('preserva a conta já vinculada mesmo que exista uma nova conta local com o mesmo e-mail', async () => {
  const { users, useCase } = setup({ ...contract, parties: [{ ...party, userId: renter.id }] })
  users.findManyByEmail.mockResolvedValue([
    renter,
    { ...renter, id: 'new-local', tenantId: input.actorTenantId },
  ])
  await expect(useCase.execute(input)).resolves.toEqual({ partyId: party.id, userId: renter.id })
})
