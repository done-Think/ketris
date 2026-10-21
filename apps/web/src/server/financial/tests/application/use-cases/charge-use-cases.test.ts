import { describe, expect, it, vi } from 'vitest'

import {
  ChargeAlreadySettledError,
  ChargeContractNotFoundError,
  ChargeNotFoundError,
} from '../../../domain/errors'
import type { Charge } from '../../../domain/charge.entity'
import type { ChargeRepository } from '../../../application/ports/charge-repository.port'
import { CreateChargeUseCase } from '../../../application/use-cases/create-charge.use-case'
import { DeleteChargeUseCase } from '../../../application/use-cases/delete-charge.use-case'
import { GetChargeUseCase } from '../../../application/use-cases/get-charge.use-case'
import { GetFinancialSummaryUseCase } from '../../../application/use-cases/get-financial-summary.use-case'
import { ListChargesUseCase } from '../../../application/use-cases/list-charges.use-case'
import { RegisterChargePaymentUseCase } from '../../../application/use-cases/register-charge-payment.use-case'
import { UpdateChargeUseCase } from '../../../application/use-cases/update-charge.use-case'

const charge: Charge = {
  id: 'charge-1',
  tenantId: 'tenant-1',
  code: 'COB-2026-0001',
  type: 'A_RECEBER',
  status: 'PENDENTE',
  amount: 2500,
  dueDate: new Date('2026-10-05T00:00:00.000Z'),
  description: 'Aluguel avulso',
  paymentMethod: null,
  receiptUrl: null,
  paidAt: null,
  createdAt: new Date('2026-09-29T00:00:00.000Z'),
  updatedAt: new Date('2026-09-29T00:00:00.000Z'),
  contractId: null,
  contractCode: null,
  propertyId: null,
  propertyTitle: null,
  propertyAddress: null,
  payerName: null,
  payerEmail: null,
}

function createRepository(overrides?: Partial<ChargeRepository>): ChargeRepository {
  return {
    findContractSummary: vi.fn().mockResolvedValue({ id: 'contract-1' }),
    create: vi.fn().mockResolvedValue(charge),
    findMany: vi.fn().mockResolvedValue({ items: [], totalCount: 0 }),
    findById: vi.fn().mockResolvedValue(charge),
    findReadableById: vi.fn().mockResolvedValue(charge),
    update: vi.fn().mockResolvedValue({ ...charge, amount: 3000 }),
    delete: vi.fn().mockResolvedValue(undefined),
    registerPayment: vi.fn().mockResolvedValue({ ...charge, status: 'PAGA', paidAt: new Date() }),
    getSummary: vi.fn().mockResolvedValue({
      monthlyReceivable: 0,
      overdueTotal: 0,
      defaultRatePercentage: 0,
      occupancyRatePercentage: 0,
      monthlySeries: [],
      upcomingDues: [],
    }),
    ...overrides,
  }
}

const baseCreateInput = {
  actorTenantId: 'tenant-1',
  actorPapel: 'OWNER' as const,
  contractId: null,
  description: 'Aluguel avulso',
  type: 'A_RECEBER' as const,
  amount: 2500,
  dueDate: new Date('2026-10-05T00:00:00.000Z'),
  status: 'PENDENTE' as const,
}

describe('CreateChargeUseCase', () => {
  it.each(['AGENT', 'RENTER'] as const)(
    'lança ForbiddenError quando o ator é %s',
    async (actorPapel) => {
      const useCase = new CreateChargeUseCase(createRepository())

      await expect(useCase.execute({ ...baseCreateInput, actorPapel })).rejects.toMatchObject({
        code: 'FORBIDDEN',
      })
    },
  )

  it('lança ChargeContractNotFoundError quando o contrato informado não existe no tenant', async () => {
    const repository = createRepository({ findContractSummary: vi.fn().mockResolvedValue(null) })
    const useCase = new CreateChargeUseCase(repository)

    await expect(
      useCase.execute({ ...baseCreateInput, contractId: 'contract-missing' }),
    ).rejects.toThrow(ChargeContractNotFoundError)
  })

  it('cria a cobrança avulsa sem validar contrato quando contractId é nulo', async () => {
    const repository = createRepository()
    const useCase = new CreateChargeUseCase(repository)

    const result = await useCase.execute(baseCreateInput)

    expect(result).toEqual(charge)
    expect(repository.findContractSummary).not.toHaveBeenCalled()
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        contractId: null,
        description: 'Aluguel avulso',
      }),
    )
  })

  it('valida o contrato antes de criar quando contractId é informado', async () => {
    const repository = createRepository()
    const useCase = new CreateChargeUseCase(repository)

    await useCase.execute({ ...baseCreateInput, contractId: 'contract-1', description: null })

    expect(repository.findContractSummary).toHaveBeenCalledWith('tenant-1', 'contract-1')
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ contractId: 'contract-1' }),
    )
  })
})

describe('ListChargesUseCase', () => {
  it('scopes renter reads by authenticated user ID instead of the shared tenant', async () => {
    const repository = createRepository()
    await new ListChargesUseCase(repository).execute({
      actorId: 'renter-1',
      actorTenantId: 'shared-renter-tenant',
      actorPapel: 'RENTER',
      search: 'Aluguel',
      page: 2,
      pageSize: 5,
    })
    expect(repository.findMany).toHaveBeenCalledWith({
      scope: { kind: 'renter', userId: 'renter-1' },
      search: 'Aluguel',
      page: 2,
      pageSize: 5,
    })
  })

  it('does not expose accounts payable to renters even when requested explicitly', async () => {
    const repository = createRepository()
    const result = await new ListChargesUseCase(repository).execute({
      actorId: 'renter-1',
      actorTenantId: 'shared',
      actorPapel: 'RENTER',
      type: 'A_PAGAR',
    })
    expect(result).toEqual({ items: [], totalCount: 0 })
    expect(repository.findMany).not.toHaveBeenCalled()
  })

  it('delega os filtros para o repositório', async () => {
    const repository = createRepository()
    const useCase = new ListChargesUseCase(repository)

    await useCase.execute({
      actorId: 'admin-1',
      actorTenantId: 'tenant-1',
      actorPapel: 'ADMIN',
      status: 'PENDENTE',
    })

    expect(repository.findMany).toHaveBeenCalledWith({
      scope: { kind: 'tenant', tenantId: 'tenant-1' },
      status: 'PENDENTE',
    })
  })

  it('lança ForbiddenError para AGENT sem consultar o repositório', async () => {
    const repository = createRepository()
    const useCase = new ListChargesUseCase(repository)

    await expect(
      useCase.execute({ actorId: 'agent-1', actorPapel: 'AGENT', actorTenantId: 'tenant-1' }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })
    expect(repository.findMany).not.toHaveBeenCalled()
  })
})

describe('GetChargeUseCase', () => {
  it('uses the renter ID to authorize a charge from an agency tenant', async () => {
    const repository = createRepository()
    await new GetChargeUseCase(repository).execute({
      actorId: 'renter-1',
      actorTenantId: 'shared',
      actorPapel: 'RENTER',
      chargeId: charge.id,
    })
    expect(repository.findReadableById).toHaveBeenCalledWith(
      { kind: 'renter', userId: 'renter-1' },
      charge.id,
    )
  })

  it('returns not found when a renter has no access to the charge', async () => {
    const repository = createRepository({ findReadableById: vi.fn().mockResolvedValue(null) })
    await expect(
      new GetChargeUseCase(repository).execute({
        actorId: 'renter-1',
        actorTenantId: 'shared',
        actorPapel: 'RENTER',
        chargeId: 'foreign',
      }),
    ).rejects.toThrow(ChargeNotFoundError)
  })

  it('lança ChargeNotFoundError quando a cobrança não existe no tenant', async () => {
    const repository = createRepository({ findReadableById: vi.fn().mockResolvedValue(null) })
    const useCase = new GetChargeUseCase(repository)

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorId: 'owner-1',
        actorPapel: 'OWNER',
        chargeId: 'missing',
      }),
    ).rejects.toThrow(ChargeNotFoundError)
  })

  it('retorna a cobrança quando encontrada', async () => {
    const repository = createRepository()
    const useCase = new GetChargeUseCase(repository)

    const result = await useCase.execute({
      actorTenantId: 'tenant-1',
      actorId: 'owner-1',
      actorPapel: 'OWNER',
      chargeId: 'charge-1',
    })

    expect(result).toEqual(charge)
  })

  it('lança ForbiddenError para AGENT', async () => {
    const repository = createRepository()
    const useCase = new GetChargeUseCase(repository)

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorId: 'agent-1',
        actorPapel: 'AGENT',
        chargeId: 'charge-1',
      }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })
    expect(repository.findById).not.toHaveBeenCalled()
  })
})

const baseUpdateInput = {
  actorTenantId: 'tenant-1',
  actorPapel: 'OWNER' as const,
  chargeId: 'charge-1',
  description: 'Aluguel avulso atualizado',
  type: 'A_RECEBER' as const,
  amount: 3000,
  dueDate: new Date('2026-11-05T00:00:00.000Z'),
  status: 'PENDENTE' as const,
}

describe('UpdateChargeUseCase', () => {
  it.each(['AGENT', 'RENTER'] as const)(
    'lança ForbiddenError quando o ator é %s',
    async (actorPapel) => {
      const useCase = new UpdateChargeUseCase(createRepository())

      await expect(useCase.execute({ ...baseUpdateInput, actorPapel })).rejects.toMatchObject({
        code: 'FORBIDDEN',
      })
    },
  )

  it('lança ChargeNotFoundError quando a cobrança não existe no tenant', async () => {
    const repository = createRepository({ findById: vi.fn().mockResolvedValue(null) })
    const useCase = new UpdateChargeUseCase(repository)

    await expect(useCase.execute(baseUpdateInput)).rejects.toThrow(ChargeNotFoundError)
  })

  it('ignora a mudança para PAGA quando a cobrança ainda não tem pagamento registrado', async () => {
    const repository = createRepository({
      findById: vi.fn().mockResolvedValue({ ...charge, status: 'PENDENTE', paidAt: null }),
    })
    const useCase = new UpdateChargeUseCase(repository)

    await useCase.execute({ ...baseUpdateInput, status: 'PAGA' })

    expect(repository.update).toHaveBeenCalledWith(
      'tenant-1',
      'charge-1',
      expect.objectContaining({
        status: 'PENDENTE',
        paymentMethod: null,
        receiptUrl: null,
        paidAt: null,
      }),
    )
  })

  it('mantém os dados de pagamento quando o status final permanece PAGA', async () => {
    const paidAt = new Date('2026-10-10T00:00:00.000Z')
    const repository = createRepository({
      findById: vi.fn().mockResolvedValue({
        ...charge,
        status: 'PAGA',
        paidAt,
        paymentMethod: 'PIX',
        receiptUrl: 'https://example.com/receipt.pdf',
      }),
    })
    const useCase = new UpdateChargeUseCase(repository)

    await useCase.execute({ ...baseUpdateInput, status: 'PAGA' })

    expect(repository.update).toHaveBeenCalledWith(
      'tenant-1',
      'charge-1',
      expect.objectContaining({
        status: 'PAGA',
        paymentMethod: 'PIX',
        receiptUrl: 'https://example.com/receipt.pdf',
        paidAt,
      }),
    )
  })

  it('limpa os dados de pagamento quando o novo status não é PAGA', async () => {
    const repository = createRepository({
      findById: vi.fn().mockResolvedValue({
        ...charge,
        status: 'PAGA',
        paidAt: new Date('2026-10-10T00:00:00.000Z'),
        paymentMethod: 'PIX',
        receiptUrl: 'https://example.com/receipt.pdf',
      }),
    })
    const useCase = new UpdateChargeUseCase(repository)

    await useCase.execute({ ...baseUpdateInput, status: 'CANCELADA' })

    expect(repository.update).toHaveBeenCalledWith(
      'tenant-1',
      'charge-1',
      expect.objectContaining({
        status: 'CANCELADA',
        paymentMethod: null,
        receiptUrl: null,
        paidAt: null,
      }),
    )
  })
})

describe('DeleteChargeUseCase', () => {
  it.each(['AGENT', 'RENTER'] as const)(
    'lança ForbiddenError quando o ator é %s',
    async (actorPapel) => {
      const repository = createRepository()
      const useCase = new DeleteChargeUseCase(repository)

      await expect(
        useCase.execute({ actorTenantId: 'tenant-1', actorPapel, chargeId: 'charge-1' }),
      ).rejects.toMatchObject({ code: 'FORBIDDEN' })
      expect(repository.delete).not.toHaveBeenCalled()
    },
  )

  it('lança ChargeNotFoundError quando a cobrança não existe no tenant', async () => {
    const repository = createRepository({ findById: vi.fn().mockResolvedValue(null) })
    const useCase = new DeleteChargeUseCase(repository)

    await expect(
      useCase.execute({ actorTenantId: 'tenant-1', actorPapel: 'OWNER', chargeId: 'charge-1' }),
    ).rejects.toThrow(ChargeNotFoundError)
  })

  it('exclui a cobrança quando ela existe no tenant', async () => {
    const repository = createRepository()
    const useCase = new DeleteChargeUseCase(repository)

    await useCase.execute({ actorTenantId: 'tenant-1', actorPapel: 'OWNER', chargeId: 'charge-1' })

    expect(repository.delete).toHaveBeenCalledWith('tenant-1', 'charge-1')
  })
})

describe('RegisterChargePaymentUseCase', () => {
  const baseInput = {
    actorTenantId: 'tenant-1',
    actorPapel: 'OWNER' as const,
    chargeId: 'charge-1',
    paidAt: new Date('2026-10-05T00:00:00.000Z'),
    paymentMethod: 'PIX',
    receiptUrl: null,
  }

  it.each(['AGENT', 'RENTER'] as const)(
    'lança ForbiddenError quando o ator é %s',
    async (actorPapel) => {
      const useCase = new RegisterChargePaymentUseCase(createRepository())

      await expect(useCase.execute({ ...baseInput, actorPapel })).rejects.toMatchObject({
        code: 'FORBIDDEN',
      })
    },
  )

  it('lança ChargeNotFoundError quando a cobrança não existe no tenant', async () => {
    const repository = createRepository({ findById: vi.fn().mockResolvedValue(null) })
    const useCase = new RegisterChargePaymentUseCase(repository)

    await expect(useCase.execute(baseInput)).rejects.toThrow(ChargeNotFoundError)
  })

  it('lança ChargeAlreadySettledError quando a cobrança já está paga', async () => {
    const repository = createRepository({
      findById: vi.fn().mockResolvedValue({ ...charge, status: 'PAGA' }),
    })
    const useCase = new RegisterChargePaymentUseCase(repository)

    await expect(useCase.execute(baseInput)).rejects.toThrow(ChargeAlreadySettledError)
  })

  it('lança ChargeAlreadySettledError quando a cobrança está cancelada', async () => {
    const repository = createRepository({
      findById: vi.fn().mockResolvedValue({ ...charge, status: 'CANCELADA' }),
    })
    const useCase = new RegisterChargePaymentUseCase(repository)

    await expect(useCase.execute(baseInput)).rejects.toThrow(ChargeAlreadySettledError)
  })

  it('registra o pagamento quando a cobrança está pendente', async () => {
    const repository = createRepository()
    const useCase = new RegisterChargePaymentUseCase(repository)

    const result = await useCase.execute(baseInput)

    expect(repository.registerPayment).toHaveBeenCalledWith('tenant-1', 'charge-1', {
      paidAt: baseInput.paidAt,
      paymentMethod: 'PIX',
      receiptUrl: null,
    })
    expect(result.status).toBe('PAGA')
  })
})

describe('GetFinancialSummaryUseCase', () => {
  it.each(['OWNER', 'ADMIN'] as const)(
    'delega para o repositório com a data de referência atual para %s',
    async (actorPapel) => {
      const repository = createRepository()
      const useCase = new GetFinancialSummaryUseCase(repository)

      await useCase.execute({ actorTenantId: 'tenant-1', actorPapel })

      expect(repository.getSummary).toHaveBeenCalledWith('tenant-1', expect.any(Date))
    },
  )

  it.each(['AGENT', 'RENTER'] as const)(
    'lança ForbiddenError para %s sem consultar o repositório',
    async (actorPapel) => {
      const repository = createRepository()
      const useCase = new GetFinancialSummaryUseCase(repository)

      await expect(
        useCase.execute({ actorTenantId: 'tenant-1', actorPapel }),
      ).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' })
      expect(repository.getSummary).not.toHaveBeenCalled()
    },
  )
})
