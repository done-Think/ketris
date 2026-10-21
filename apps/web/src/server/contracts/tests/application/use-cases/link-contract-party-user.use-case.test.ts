import { describe, expect, it, vi } from 'vitest'

import type { User } from '@server/auth/domain/user.entity'
import type { Contract } from '../../../domain/contract.entity'
import { LinkContractPartyUserUseCase } from '../../../application/use-cases/link-contract-party-user.use-case'

const party = {
  id: 'party-1',
  userId: null,
  role: 'LOCATARIO' as const,
  name: 'Maria',
  cpf: '11111111111',
  email: 'Maria@example.com',
  phone: null,
  signatureStatus: 'PENDENTE' as const,
  signedAt: null,
  signedBy: null,
}

const contract: Contract = {
  id: 'contract-1',
  tenantId: 'agency-1',
  propertyId: 'property-1',
  opportunityId: 'opportunity-1',
  code: 'CTR-1',
  type: 'RESIDENCIAL',
  amount: 1000,
  dueDay: 5,
  startDate: new Date(),
  endDate: new Date(),
  adjustmentIndex: 'IPCA',
  guaranteeType: 'CAUCAO',
  notes: null,
  status: 'ATIVO',
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
  nome: 'Maria',
  email: 'maria@example.com',
  senhaHash: 'hash',
  papel: 'RENTER',
  ativo: true,
  vinculoAprovadoEm: new Date(),
}

const input = {
  actorTenantId: 'agency-1',
  actorPapel: 'ADMIN' as const,
  contractId: 'contract-1',
  partyId: 'party-1',
  email: ' MARIA@example.com ',
}

function setup(foundContract: Contract | null = contract, foundUser: User | null = renter) {
  const contracts = {
    findById: vi.fn().mockResolvedValue(foundContract),
    linkPartyUser: vi.fn().mockResolvedValue(true),
  }
  const users = { findByEmail: vi.fn().mockResolvedValue(foundUser) }
  return { contracts, users, useCase: new LinkContractPartyUserUseCase(contracts, users) }
}

describe('LinkContractPartyUserUseCase', () => {
  it.each(['RENTER', 'AGENT', 'OWNER'] as const)(
    'rejects %s before looking up a contract or user',
    async (actorPapel) => {
      const { contracts, users, useCase } = setup()
      await expect(useCase.execute({ ...input, actorPapel })).rejects.toMatchObject({
        code: 'FORBIDDEN',
      })
      expect(contracts.findById).not.toHaveBeenCalled()
      expect(users.findByEmail).not.toHaveBeenCalled()
    },
  )

  it('does not look up users when the contract is outside the administrator tenant', async () => {
    const { contracts, users, useCase } = setup(null)
    await expect(useCase.execute(input)).rejects.toMatchObject({ code: 'CONTRACT_NOT_FOUND' })
    expect(contracts.findById).toHaveBeenCalledWith('agency-1', 'contract-1', {})
    expect(users.findByEmail).not.toHaveBeenCalled()
  })

  it.each(['LOCADOR', 'FIADOR'] as const)('does not link a %s party', async (role) => {
    const { contracts, users, useCase } = setup({ ...contract, parties: [{ ...party, role }] })
    await expect(useCase.execute(input)).rejects.toMatchObject({ code: 'CONTRACT_PARTY_NOT_FOUND' })
    expect(contracts.linkPartyUser).not.toHaveBeenCalled()
    expect(users.findByEmail).not.toHaveBeenCalled()
  })

  it('does not link a party from another contract', async () => {
    const { users, useCase } = setup()
    await expect(useCase.execute({ ...input, partyId: 'foreign-party' })).rejects.toMatchObject({
      code: 'CONTRACT_PARTY_NOT_FOUND',
    })
    expect(users.findByEmail).not.toHaveBeenCalled()
  })

  it('rejects an email different from the contract party email', async () => {
    const { users, useCase } = setup()
    await expect(useCase.execute({ ...input, email: 'other@example.com' })).rejects.toMatchObject({
      code: 'CONFLICT',
    })
    expect(users.findByEmail).not.toHaveBeenCalled()
  })

  it.each([null, { ...renter, ativo: false }, { ...renter, papel: 'AGENT' as const }])(
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
    expect(users.findByEmail).toHaveBeenCalledWith('maria@example.com')
    expect(contracts.linkPartyUser).toHaveBeenCalledWith({
      tenantId: 'agency-1',
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
