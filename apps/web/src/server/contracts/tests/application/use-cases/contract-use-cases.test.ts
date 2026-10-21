import { describe, expect, it, vi } from 'vitest'

import {
  ContractNotFoundError,
  ContractPartyAlreadySignedError,
  ContractPartyNotFoundError,
  ContractRenterForbiddenError,
  GuarantorPartyRequiredError,
  OpportunityAlreadyHasContractError,
  OpportunityNotAcceptedError,
  OpportunityNotFoundError,
} from '../../../domain/errors'
import type { Contract } from '../../../domain/contract.entity'
import type { ContractRepository } from '../../../application/ports/contract-repository.port'
import { CreateContractFromOpportunityUseCase } from '../../../application/use-cases/create-contract-from-opportunity.use-case'
import { GetContractUseCase } from '../../../application/use-cases/get-contract.use-case'
import { ListContractsUseCase } from '../../../application/use-cases/list-contracts.use-case'
import { SignContractPartyUseCase } from '../../../application/use-cases/sign-contract-party.use-case'

const contract: Contract = {
  id: 'contract-1',
  tenantId: 'tenant-1',
  propertyId: 'property-1',
  opportunityId: 'opportunity-1',
  code: 'CTR-2026-0001',
  type: 'RESIDENCIAL',
  amount: 2500,
  dueDay: 5,
  startDate: new Date('2026-10-01T00:00:00.000Z'),
  endDate: new Date('2027-10-01T00:00:00.000Z'),
  adjustmentIndex: 'IGPM',
  guaranteeType: 'CAUCAO',
  notes: null,
  status: 'AGUARDANDO_ASSINATURA',
  activatedAt: null,
  activatedBy: null,
  createdAt: new Date('2026-09-29T00:00:00.000Z'),
  updatedAt: new Date('2026-09-29T00:00:00.000Z'),
  parties: [
    {
      id: 'party-owner',
      userId: null,
      role: 'LOCADOR',
      name: 'Bruno Oliveira',
      cpf: '11111111111',
      email: 'bruno@example.com',
      phone: null,
      signatureStatus: 'PENDENTE',
      signedAt: null,
      signedBy: null,
    },
    {
      id: 'party-tenant',
      userId: null,
      role: 'LOCATARIO',
      name: 'Mariana Souza',
      cpf: '22222222222',
      email: 'mariana@example.com',
      phone: null,
      signatureStatus: 'ASSINADA',
      signedAt: new Date('2026-09-29T00:00:00.000Z'),
      signedBy: { id: 'agent-1', name: 'Camila Rocha' },
    },
  ],
  documents: [],
}

function createRepository(overrides?: Partial<ContractRepository>): ContractRepository {
  return {
    findEligibleOpportunity: vi.fn().mockResolvedValue({
      id: 'opportunity-1',
      propertyId: 'property-1',
      status: 'ACEITA',
      hasContract: false,
    }),
    create: vi.fn().mockResolvedValue(contract),
    findMany: vi.fn().mockResolvedValue({ items: [], totalCount: 0 }),
    findById: vi.fn().mockResolvedValue(contract),
    signParty: vi.fn().mockResolvedValue({ ...contract, status: 'ATIVO' }),
    linkPartyUser: vi.fn().mockResolvedValue(true),
    ...overrides,
  }
}

const baseCreateInput = {
  actorTenantId: 'tenant-1',
  actorId: 'agent-1',
  actorPapel: 'AGENT' as const,
  opportunityId: 'opportunity-1',
  type: 'RESIDENCIAL' as const,
  dueDay: 5,
  startDate: new Date('2026-10-01T00:00:00.000Z'),
  endDate: new Date('2027-10-01T00:00:00.000Z'),
  adjustmentIndex: 'IGPM' as const,
  guaranteeType: 'CAUCAO' as const,
  notes: null,
  owner: { name: 'Bruno Oliveira', cpf: '11111111111', email: 'bruno@example.com', phone: null },
  tenant: { name: 'Mariana Souza', cpf: '22222222222', email: 'mariana@example.com', phone: null },
  guarantor: null,
}

describe('CreateContractFromOpportunityUseCase', () => {
  it('lança ForbiddenError quando o ator é RENTER', async () => {
    const useCase = new CreateContractFromOpportunityUseCase(createRepository())

    await expect(
      useCase.execute({ ...baseCreateInput, actorPapel: 'RENTER' }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })
  })

  it('busca a oportunidade do AGENT só entre os imóveis pelos quais ele é responsável', async () => {
    const repository = createRepository()
    const useCase = new CreateContractFromOpportunityUseCase(repository)

    await useCase.execute(baseCreateInput)

    expect(repository.findEligibleOpportunity).toHaveBeenCalledWith('tenant-1', 'opportunity-1', {
      responsibleId: 'agent-1',
    })
  })

  it('responde 404 e não cria quando o AGENT não é o responsável pelo imóvel', async () => {
    const repository = createRepository({
      findEligibleOpportunity: vi.fn().mockResolvedValue(null),
    })
    const useCase = new CreateContractFromOpportunityUseCase(repository)

    await expect(useCase.execute({ ...baseCreateInput, actorId: 'agent-2' })).rejects.toThrow(
      OpportunityNotFoundError,
    )
    expect(repository.create).not.toHaveBeenCalled()
  })

  it.each(['ADMIN', 'OWNER'] as const)(
    'deixa %s criar a partir de qualquer oportunidade aceita do tenant',
    async (actorPapel) => {
      const repository = createRepository()
      const useCase = new CreateContractFromOpportunityUseCase(repository)

      await useCase.execute({ ...baseCreateInput, actorId: 'user-1', actorPapel })

      expect(repository.findEligibleOpportunity).toHaveBeenCalledWith(
        'tenant-1',
        'opportunity-1',
        {},
      )
    },
  )

  it('lança GuarantorPartyRequiredError quando a garantia é fiador sem dados do fiador', async () => {
    const useCase = new CreateContractFromOpportunityUseCase(createRepository())

    await expect(
      useCase.execute({ ...baseCreateInput, guaranteeType: 'FIADOR', guarantor: null }),
    ).rejects.toThrow(GuarantorPartyRequiredError)
  })

  it('lança OpportunityNotFoundError quando a oportunidade não existe no tenant', async () => {
    const repository = createRepository({
      findEligibleOpportunity: vi.fn().mockResolvedValue(null),
    })
    const useCase = new CreateContractFromOpportunityUseCase(repository)

    await expect(useCase.execute(baseCreateInput)).rejects.toThrow(OpportunityNotFoundError)
  })

  it('lança OpportunityAlreadyHasContractError quando a oportunidade já tem contrato', async () => {
    const repository = createRepository({
      findEligibleOpportunity: vi.fn().mockResolvedValue({
        id: 'opportunity-1',
        propertyId: 'property-1',
        status: 'ACEITA',
        hasContract: true,
      }),
    })
    const useCase = new CreateContractFromOpportunityUseCase(repository)

    await expect(useCase.execute(baseCreateInput)).rejects.toThrow(
      OpportunityAlreadyHasContractError,
    )
  })

  it('lança OpportunityNotAcceptedError quando a oportunidade não está aceita', async () => {
    const repository = createRepository({
      findEligibleOpportunity: vi.fn().mockResolvedValue({
        id: 'opportunity-1',
        propertyId: 'property-1',
        status: 'EM_NEGOCIACAO',
        hasContract: false,
      }),
    })
    const useCase = new CreateContractFromOpportunityUseCase(repository)

    await expect(useCase.execute(baseCreateInput)).rejects.toThrow(OpportunityNotAcceptedError)
  })

  it('cria o contrato com locador e locatário quando elegível', async () => {
    const repository = createRepository()
    const useCase = new CreateContractFromOpportunityUseCase(repository)

    const result = await useCase.execute(baseCreateInput)

    expect(result).toEqual(contract)
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        opportunityId: 'opportunity-1',
        parties: [
          expect.objectContaining({ role: 'LOCADOR', name: 'Bruno Oliveira' }),
          expect.objectContaining({ role: 'LOCATARIO', name: 'Mariana Souza' }),
        ],
      }),
    )
  })

  it('inclui a parte fiador quando a garantia é fiador e os dados foram informados', async () => {
    const repository = createRepository()
    const useCase = new CreateContractFromOpportunityUseCase(repository)
    const guarantor = {
      name: 'Carlos Fiador',
      cpf: '33333333333',
      email: 'carlos@example.com',
      phone: null,
    }

    await useCase.execute({ ...baseCreateInput, guaranteeType: 'FIADOR', guarantor })

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        parties: [
          expect.objectContaining({ role: 'LOCADOR' }),
          expect.objectContaining({ role: 'LOCATARIO' }),
          expect.objectContaining({ role: 'FIADOR', name: 'Carlos Fiador' }),
        ],
      }),
    )
  })
})

describe('ListContractsUseCase', () => {
  it.each(['ADMIN', 'OWNER'] as const)(
    'lista todos os contratos do tenant para %s, sem filtro de responsável',
    async (actorPapel) => {
      const repository = createRepository()
      const useCase = new ListContractsUseCase(repository)

      await useCase.execute({
        tenantId: 'tenant-1',
        actorId: 'user-1',
        actorPapel,
        status: 'ATIVO',
      })

      expect(repository.findMany).toHaveBeenCalledWith(
        { tenantId: 'tenant-1', status: 'ATIVO' },
        {},
      )
    },
  )

  it('restringe a lista do AGENT aos imóveis pelos quais ele é responsável', async () => {
    const repository = createRepository()
    const useCase = new ListContractsUseCase(repository)

    await useCase.execute({ tenantId: 'tenant-1', actorId: 'agent-1', actorPapel: 'AGENT' })

    expect(repository.findMany).toHaveBeenCalledWith(
      { tenantId: 'tenant-1' },
      { responsibleId: 'agent-1' },
    )
  })

  it('lança 403 para RENTER sem consultar o repositório', async () => {
    const repository = createRepository()
    const useCase = new ListContractsUseCase(repository)

    await expect(
      useCase.execute({ tenantId: 'tenant-1', actorId: 'renter-1', actorPapel: 'RENTER' }),
    ).rejects.toThrow(ContractRenterForbiddenError)
    expect(repository.findMany).not.toHaveBeenCalled()
  })
})

describe('GetContractUseCase', () => {
  const baseGetInput = {
    actorTenantId: 'tenant-1',
    actorId: 'user-1',
    actorPapel: 'ADMIN' as const,
    contractId: 'contract-1',
  }

  it('lança ContractNotFoundError quando o contrato não existe no tenant', async () => {
    const repository = createRepository({ findById: vi.fn().mockResolvedValue(null) })
    const useCase = new GetContractUseCase(repository)

    await expect(useCase.execute({ ...baseGetInput, contractId: 'missing' })).rejects.toThrow(
      ContractNotFoundError,
    )
  })

  it('retorna o contrato quando encontrado, sem filtro de responsável para ADMIN', async () => {
    const repository = createRepository()
    const useCase = new GetContractUseCase(repository)

    const result = await useCase.execute(baseGetInput)

    expect(result).toEqual(contract)
    expect(repository.findById).toHaveBeenCalledWith('tenant-1', 'contract-1', {})
  })

  it('busca o contrato do AGENT só entre os imóveis pelos quais ele é responsável', async () => {
    const repository = createRepository()
    const useCase = new GetContractUseCase(repository)

    await useCase.execute({ ...baseGetInput, actorId: 'agent-1', actorPapel: 'AGENT' })

    expect(repository.findById).toHaveBeenCalledWith('tenant-1', 'contract-1', {
      responsibleId: 'agent-1',
    })
  })

  it('responde 404 para o AGENT quando o contrato é de imóvel de outro responsável', async () => {
    const repository = createRepository({ findById: vi.fn().mockResolvedValue(null) })
    const useCase = new GetContractUseCase(repository)

    await expect(
      useCase.execute({ ...baseGetInput, actorId: 'agent-2', actorPapel: 'AGENT' }),
    ).rejects.toThrow(ContractNotFoundError)
  })

  it('lança 403 para RENTER sem consultar o repositório', async () => {
    const repository = createRepository()
    const useCase = new GetContractUseCase(repository)

    await expect(
      useCase.execute({ ...baseGetInput, actorId: 'renter-1', actorPapel: 'RENTER' }),
    ).rejects.toThrow(ContractRenterForbiddenError)
    expect(repository.findById).not.toHaveBeenCalled()
  })
})

describe('SignContractPartyUseCase', () => {
  const baseSignInput = {
    actorTenantId: 'tenant-1',
    actorId: 'agent-1',
    actorPapel: 'AGENT' as const,
    contractId: 'contract-1',
    partyId: 'party-owner',
  }

  it('lança 403 quando o ator é RENTER, sem consultar o repositório', async () => {
    const repository = createRepository()
    const useCase = new SignContractPartyUseCase(repository)

    await expect(
      useCase.execute({ ...baseSignInput, actorId: 'renter-1', actorPapel: 'RENTER' }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })
    expect(repository.findById).not.toHaveBeenCalled()
  })

  it('lança ContractNotFoundError quando o contrato não existe no tenant', async () => {
    const repository = createRepository({ findById: vi.fn().mockResolvedValue(null) })
    const useCase = new SignContractPartyUseCase(repository)

    await expect(useCase.execute({ ...baseSignInput, contractId: 'missing' })).rejects.toThrow(
      ContractNotFoundError,
    )
  })

  it('busca o contrato do AGENT só entre os imóveis pelos quais ele é responsável', async () => {
    const repository = createRepository()
    const useCase = new SignContractPartyUseCase(repository)

    await useCase.execute(baseSignInput)

    expect(repository.findById).toHaveBeenCalledWith('tenant-1', 'contract-1', {
      responsibleId: 'agent-1',
    })
  })

  it('não assina e responde 404 quando o AGENT não é o responsável pelo imóvel', async () => {
    const repository = createRepository({ findById: vi.fn().mockResolvedValue(null) })
    const useCase = new SignContractPartyUseCase(repository)

    await expect(useCase.execute({ ...baseSignInput, actorId: 'agent-2' })).rejects.toThrow(
      ContractNotFoundError,
    )
    expect(repository.signParty).not.toHaveBeenCalled()
  })

  it('deixa ADMIN e OWNER assinarem qualquer contrato do tenant', async () => {
    const repository = createRepository()
    const useCase = new SignContractPartyUseCase(repository)

    await useCase.execute({ ...baseSignInput, actorId: 'admin-1', actorPapel: 'ADMIN' })
    await useCase.execute({ ...baseSignInput, actorId: 'owner-1', actorPapel: 'OWNER' })

    expect(repository.findById).toHaveBeenNthCalledWith(1, 'tenant-1', 'contract-1', {})
    expect(repository.findById).toHaveBeenNthCalledWith(2, 'tenant-1', 'contract-1', {})
    expect(repository.signParty).toHaveBeenCalledTimes(2)
  })

  it('lança ContractPartyNotFoundError quando a parte não pertence ao contrato', async () => {
    const repository = createRepository()
    const useCase = new SignContractPartyUseCase(repository)

    await expect(useCase.execute({ ...baseSignInput, partyId: 'party-unknown' })).rejects.toThrow(
      ContractPartyNotFoundError,
    )
  })

  it('lança ContractPartyAlreadySignedError quando a parte já assinou', async () => {
    const repository = createRepository()
    const useCase = new SignContractPartyUseCase(repository)

    await expect(useCase.execute({ ...baseSignInput, partyId: 'party-tenant' })).rejects.toThrow(
      ContractPartyAlreadySignedError,
    )
  })

  it('assina a parte pendente e retorna o contrato atualizado', async () => {
    const repository = createRepository()
    const useCase = new SignContractPartyUseCase(repository)

    const result = await useCase.execute(baseSignInput)

    expect(repository.signParty).toHaveBeenCalledWith(
      'tenant-1',
      'contract-1',
      'party-owner',
      'agent-1',
    )
    expect(result.status).toBe('ATIVO')
  })
})
