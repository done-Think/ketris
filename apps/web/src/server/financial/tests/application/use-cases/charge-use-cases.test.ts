import { describe, expect, it, vi } from 'vitest'

import {
  ChargeAlreadySettledError,
  ChargeContractNotFoundError,
  ChargeNotFoundError,
} from '../../../domain/errors'
import type { Charge } from '../../../domain/charge.entity'
import type { ChargeRepository } from '../../../application/ports/charge-repository.port'
import { CreateChargeUseCase } from '../../../application/use-cases/create-charge.use-case'
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
    update: vi.fn().mockResolvedValue({ ...charge, amount: 3000 }),
    registerPayment: vi.fn().mockResolvedValue({ ...charge, status: 'PAGA', paidAt: new Date() }),
    getSummary: vi.fn().mockResolvedValue({
      monthlyReceivable: 0,
      overdueTotal: 0,
      defaultRatePercentage: 0,
      monthlySeries: [],
      upcomingDues: [],
    }),
    ...overrides,
  }
}

const baseCreateInput = {
  actorTenantId: 'tenant-1',
  actorPapel: 'AGENT' as const,
  contractId: null,
  description: 'Aluguel avulso',
  type: 'A_RECEBER' as const,
  amount: 2500,
  dueDate: new Date('2026-10-05T00:00:00.000Z'),
  status: 'PENDENTE' as const,
}

describe('CreateChargeUseCase', () => {
  it('lança ForbiddenError quando o ator é RENTER', async () => {
    const useCase = new CreateChargeUseCase(createRepository())

    await expect(
      useCase.execute({ ...baseCreateInput, actorPapel: 'RENTER' }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })
  })

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
  it('delega os filtros para o repositório', async () => {
    const repository = createRepository()
    const useCase = new ListChargesUseCase(repository)

    await useCase.execute({ tenantId: 'tenant-1', status: 'PENDENTE' })

    expect(repository.findMany).toHaveBeenCalledWith({ tenantId: 'tenant-1', status: 'PENDENTE' })
  })
})

describe('GetChargeUseCase', () => {
  it('lança ChargeNotFoundError quando a cobrança não existe no tenant', async () => {
    const repository = createRepository({ findById: vi.fn().mockResolvedValue(null) })
    const useCase = new GetChargeUseCase(repository)

    await expect(
      useCase.execute({ actorTenantId: 'tenant-1', chargeId: 'missing' }),
    ).rejects.toThrow(ChargeNotFoundError)
  })

  it('retorna a cobrança quando encontrada', async () => {
    const repository = createRepository()
    const useCase = new GetChargeUseCase(repository)

    const result = await useCase.execute({ actorTenantId: 'tenant-1', chargeId: 'charge-1' })

    expect(result).toEqual(charge)
  })
})

const baseUpdateInput = {
  actorTenantId: 'tenant-1',
  actorPapel: 'AGENT' as const,
  chargeId: 'charge-1',
  description: 'Aluguel avulso atualizado',
  type: 'A_RECEBER' as const,
  amount: 3000,
  dueDate: new Date('2026-11-05T00:00:00.000Z'),
  status: 'PENDENTE' as const,
}

describe('UpdateChargeUseCase', () => {
  it('lança ForbiddenError quando o ator é RENTER', async () => {
    const useCase = new UpdateChargeUseCase(createRepository())

    await expect(
      useCase.execute({ ...baseUpdateInput, actorPapel: 'RENTER' }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })
  })

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

describe('RegisterChargePaymentUseCase', () => {
  const baseInput = {
    actorTenantId: 'tenant-1',
    actorPapel: 'AGENT' as const,
    chargeId: 'charge-1',
    paidAt: new Date('2026-10-05T00:00:00.000Z'),
    paymentMethod: 'PIX',
    receiptUrl: null,
  }

  it('lança ForbiddenError quando o ator é RENTER', async () => {
    const useCase = new RegisterChargePaymentUseCase(createRepository())

    await expect(useCase.execute({ ...baseInput, actorPapel: 'RENTER' })).rejects.toMatchObject({
      code: 'FORBIDDEN',
    })
  })

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
  it('delega para o repositório com a data de referência atual', async () => {
    const repository = createRepository()
    const useCase = new GetFinancialSummaryUseCase(repository)

    await useCase.execute({ actorTenantId: 'tenant-1' })

    expect(repository.getSummary).toHaveBeenCalledWith('tenant-1', expect.any(Date))
  })
})
