import { describe, expect, it, vi } from 'vitest'

import {
  ContractNotFoundError,
  ContractPartyAlreadySignedError,
  ContractPartyNotFoundError,
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
  createdAt: new Date('2026-09-29T00:00:00.000Z'),
  updatedAt: new Date('2026-09-29T00:00:00.000Z'),
  parties: [
    {
      id: 'party-owner',
      role: 'LOCADOR',
      name: 'Bruno Oliveira',
      cpf: '11111111111',
      email: 'bruno@example.com',
      phone: null,
      signatureStatus: 'PENDENTE',
      signedAt: null,
    },
    {
      id: 'party-tenant',
      role: 'LOCATARIO',
      name: 'Mariana Souza',
      cpf: '22222222222',
      email: 'mariana@example.com',
      phone: null,
      signatureStatus: 'ASSINADA',
      signedAt: new Date('2026-09-29T00:00:00.000Z'),
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
    ...overrides,
  }
}

const baseCreateInput = {
  actorTenantId: 'tenant-1',
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
      findEligibleOpportunity: vi
        .fn()
        .mockResolvedValue({
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
  it('delega os filtros para o repositório', async () => {
    const repository = createRepository()
    const useCase = new ListContractsUseCase(repository)

    await useCase.execute({ tenantId: 'tenant-1', status: 'ATIVO' })

    expect(repository.findMany).toHaveBeenCalledWith({ tenantId: 'tenant-1', status: 'ATIVO' })
  })
})

describe('GetContractUseCase', () => {
  it('lança ContractNotFoundError quando o contrato não existe no tenant', async () => {
    const repository = createRepository({ findById: vi.fn().mockResolvedValue(null) })
    const useCase = new GetContractUseCase(repository)

    await expect(
      useCase.execute({ actorTenantId: 'tenant-1', contractId: 'missing' }),
    ).rejects.toThrow(ContractNotFoundError)
  })

  it('retorna o contrato quando encontrado', async () => {
    const repository = createRepository()
    const useCase = new GetContractUseCase(repository)

    const result = await useCase.execute({ actorTenantId: 'tenant-1', contractId: 'contract-1' })

    expect(result).toEqual(contract)
  })
})

describe('SignContractPartyUseCase', () => {
  it('lança ForbiddenError quando o ator é RENTER', async () => {
    const useCase = new SignContractPartyUseCase(createRepository())

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorPapel: 'RENTER',
        contractId: 'contract-1',
        partyId: 'party-owner',
      }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })
  })

  it('lança ContractNotFoundError quando o contrato não existe no tenant', async () => {
    const repository = createRepository({ findById: vi.fn().mockResolvedValue(null) })
    const useCase = new SignContractPartyUseCase(repository)

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorPapel: 'AGENT',
        contractId: 'missing',
        partyId: 'party-owner',
      }),
    ).rejects.toThrow(ContractNotFoundError)
  })

  it('lança ContractPartyNotFoundError quando a parte não pertence ao contrato', async () => {
    const repository = createRepository()
    const useCase = new SignContractPartyUseCase(repository)

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorPapel: 'AGENT',
        contractId: 'contract-1',
        partyId: 'party-unknown',
      }),
    ).rejects.toThrow(ContractPartyNotFoundError)
  })

  it('lança ContractPartyAlreadySignedError quando a parte já assinou', async () => {
    const repository = createRepository()
    const useCase = new SignContractPartyUseCase(repository)

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorPapel: 'AGENT',
        contractId: 'contract-1',
        partyId: 'party-tenant',
      }),
    ).rejects.toThrow(ContractPartyAlreadySignedError)
  })

  it('assina a parte pendente e retorna o contrato atualizado', async () => {
    const repository = createRepository()
    const useCase = new SignContractPartyUseCase(repository)

    const result = await useCase.execute({
      actorTenantId: 'tenant-1',
      actorPapel: 'AGENT',
      contractId: 'contract-1',
      partyId: 'party-owner',
    })

    expect(repository.signParty).toHaveBeenCalledWith('tenant-1', 'contract-1', 'party-owner')
    expect(result.status).toBe('ATIVO')
  })
})
