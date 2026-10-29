import { describe, expect, it, vi } from 'vitest'

import { CancelChargeUseCase } from '../../../application/use-cases/cancel-charge.use-case'
import { CreateChargeUseCase } from '../../../application/use-cases/create-charge.use-case'
import { DeleteChargeUseCase } from '../../../application/use-cases/delete-charge.use-case'
import { ExportChargesUseCase } from '../../../application/use-cases/export-charges.use-case'
import { DownloadChargeReceiptUseCase } from '../../../application/use-cases/download-charge-receipt.use-case'
import { GetChargeUseCase } from '../../../application/use-cases/get-charge.use-case'
import { GetFinancialSummaryUseCase } from '../../../application/use-cases/get-financial-summary.use-case'
import { InitChargeReceiptUploadUseCase } from '../../../application/use-cases/init-charge-receipt-upload.use-case'
import { ListChargeHistoryUseCase } from '../../../application/use-cases/list-charge-history.use-case'
import { ListChargesUseCase } from '../../../application/use-cases/list-charges.use-case'
import { RegisterChargePaymentUseCase } from '../../../application/use-cases/register-charge-payment.use-case'
import { ReverseChargePaymentUseCase } from '../../../application/use-cases/reverse-charge-payment.use-case'
import { UpdateChargeUseCase } from '../../../application/use-cases/update-charge.use-case'
import {
  ChargeAlreadySettledError,
  ChargeContractNotFoundError,
  ChargeHasMovementError,
  ChargeLockedError,
  ChargeNotFoundError,
  ChargeNotPaidError,
  ChargeReceiptInvalidError,
  ChargeReceiptNotFoundError,
} from '../../../domain/errors'
import {
  createRepository,
  createStorage,
  createTickets,
  now,
  owner,
  receiptDescriptor,
  storedCharge,
} from '../../fixtures/charge'

const clock = () => now
const today = new Date('2026-10-26T00:00:00.000Z')
const overdue = storedCharge({ dueDate: new Date('2026-10-20T00:00:00.000Z') })

describe('acesso ao financeiro', () => {
  it.each(['AGENT', 'RENTER', 'PROPERTY_OWNER'] as const)(
    '%s não escreve no financeiro',
    async (actorRole) => {
      const repository = createRepository()
      const actor = { ...owner, actorRole }
      const calls = [
        new CreateChargeUseCase(repository).execute({
          ...actor,
          contractId: null,
          description: 'x',
          type: 'RECEIVABLE',
          amount: 1,
          dueDate: today,
          status: 'PENDING',
        }),
        new UpdateChargeUseCase(repository).execute({ ...actor, chargeId: 'charge-1', amount: 2 }),
        new CancelChargeUseCase(repository).execute({
          ...actor,
          chargeId: 'charge-1',
          reason: 'x',
        }),
        new DeleteChargeUseCase(repository).execute({ ...actor, chargeId: 'charge-1' }),
        new ListChargeHistoryUseCase(repository).execute({ ...actor, chargeId: 'charge-1' }),
        new GetFinancialSummaryUseCase(repository).execute(actor),
      ]

      for (const call of calls) await expect(call).rejects.toMatchObject({ status: 403 })
      expect(repository.create).not.toHaveBeenCalled()
      expect(repository.update).not.toHaveBeenCalled()
    },
  )
})

describe('CreateChargeUseCase', () => {
  const input = {
    ...owner,
    contractId: null,
    description: 'Aluguel avulso',
    type: 'RECEIVABLE' as const,
    amount: 2500,
    dueDate: today,
    status: 'PENDING' as const,
  }

  it('cria com o autor e devolve o status efetivo', async () => {
    const repository = createRepository({ create: vi.fn().mockResolvedValue(overdue) })

    const charge = await new CreateChargeUseCase(repository, clock).execute(input)

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 'tenant-1', amount: 2500 }),
      { tenantId: 'tenant-1', actorId: 'owner-1' },
    )
    expect(charge.status).toBe('OVERDUE')
  })

  it('valida o contrato no tenant', async () => {
    const repository = createRepository({ findContractSummary: vi.fn().mockResolvedValue(null) })

    await expect(
      new CreateChargeUseCase(repository).execute({ ...input, contractId: 'contract-x' }),
    ).rejects.toBeInstanceOf(ChargeContractNotFoundError)
  })
})

describe('ListChargesUseCase e GetChargeUseCase', () => {
  it('passa o dia de São Paulo para o filtro e marca as vencidas como atrasadas', async () => {
    const repository = createRepository({
      findMany: vi.fn().mockResolvedValue({
        items: [overdue],
        totalCount: 1,
        statusCounts: { ALL: 1, PENDING: 0, OVERDUE: 1, PAID: 0, SCHEDULED: 0, CANCELED: 0 },
      }),
    })

    const result = await new ListChargesUseCase(repository, clock).execute({
      ...owner,
      status: 'OVERDUE',
    })

    expect(repository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        today,
        status: 'OVERDUE',
        scope: { kind: 'tenant', tenantId: 'tenant-1' },
      }),
    )
    expect(result.items[0].status).toBe('OVERDUE')
  })

  it('não mostra contas a pagar para o locatário', async () => {
    const repository = createRepository()

    const result = await new ListChargesUseCase(repository).execute({
      actorId: 'renter-1',
      actorTenantId: 'renters',
      actorRole: 'RENTER',
      type: 'PAYABLE',
    })

    expect(result).toMatchObject({ items: [], totalCount: 0 })
    expect(repository.findMany).not.toHaveBeenCalled()
  })

  it('devolve 404 quando a cobrança não está no escopo', async () => {
    const repository = createRepository({ findReadableById: vi.fn().mockResolvedValue(null) })

    await expect(
      new GetChargeUseCase(repository).execute({ ...owner, chargeId: 'x' }),
    ).rejects.toBeInstanceOf(ChargeNotFoundError)
  })
})

describe('UpdateChargeUseCase', () => {
  it('grava só os campos alterados', async () => {
    const repository = createRepository()

    await new UpdateChargeUseCase(repository, clock).execute({
      ...owner,
      chargeId: 'charge-1',
      description: 'Aluguel avulso',
      amount: 3000,
    })

    expect(repository.update).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'charge-1' }),
      expect.objectContaining({ amount: 3000 }),
      ['amount'],
      { tenantId: 'tenant-1', actorId: 'owner-1' },
    )
  })

  it('não grava nada quando nada mudou', async () => {
    const repository = createRepository()

    await new UpdateChargeUseCase(repository).execute({
      ...owner,
      chargeId: 'charge-1',
      amount: 2500,
    })

    expect(repository.update).not.toHaveBeenCalled()
  })

  it('trava valor, vencimento e tipo de uma cobrança paga', async () => {
    const repository = createRepository({
      findById: vi.fn().mockResolvedValue(storedCharge({ storedStatus: 'PAID' })),
    })

    await expect(
      new UpdateChargeUseCase(repository).execute({ ...owner, chargeId: 'charge-1', amount: 1 }),
    ).rejects.toBeInstanceOf(ChargeLockedError)
    await new UpdateChargeUseCase(repository).execute({
      ...owner,
      chargeId: 'charge-1',
      description: 'Corrigido',
    })
    expect(repository.update).toHaveBeenCalledTimes(1)
  })

  it('devolve 404 fora do tenant', async () => {
    const repository = createRepository({ findById: vi.fn().mockResolvedValue(null) })

    await expect(
      new UpdateChargeUseCase(repository).execute({ ...owner, chargeId: 'x', amount: 1 }),
    ).rejects.toBeInstanceOf(ChargeNotFoundError)
  })
})

describe('RegisterChargePaymentUseCase', () => {
  const input = {
    ...owner,
    chargeId: 'charge-1',
    paidAt: now,
    paymentMethod: 'PIX',
    receiptUploadToken: null,
  }

  it('registra o pagamento sem comprovante', async () => {
    const repository = createRepository()

    await new RegisterChargePaymentUseCase(repository, createStorage(), createTickets()).execute(
      input,
    )

    expect(repository.registerPayment).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'charge-1' }),
      { paidAt: now, paymentMethod: 'PIX', receipt: null },
      { tenantId: 'tenant-1', actorId: 'owner-1' },
    )
  })

  it('anexa o comprovante conferido no armazenamento', async () => {
    const repository = createRepository()
    const storage = createStorage()

    await new RegisterChargePaymentUseCase(repository, storage, createTickets()).execute({
      ...input,
      receiptUploadToken: 'token',
    })

    expect(storage.inspect).toHaveBeenCalledWith('financial/tenant-1/charge-1/receipt-1.pdf')
    expect(vi.mocked(repository.registerPayment).mock.calls[0][1].receipt).toMatchObject({
      id: 'receipt-1',
      objectKey: 'financial/tenant-1/charge-1/receipt-1.pdf',
      contentType: 'application/pdf',
    })
  })

  it.each([
    ['tamanho', { size: 1 }],
    ['hash', { sha256: 'b'.repeat(64) }],
    ['type', { contentType: 'image/png' }],
    ['signature', { signature: new Uint8Array([0x3c, 0x68]) }],
  ])('recusa comprovante com %s diferente do informado', async (_label, change) => {
    const storage = createStorage({
      inspect: vi.fn().mockResolvedValue({
        size: 1200,
        contentType: 'application/pdf',
        sha256: 'a'.repeat(64),
        signature: new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]),
        ...change,
      }),
    })
    const repository = createRepository()

    await expect(
      new RegisterChargePaymentUseCase(repository, storage, createTickets()).execute({
        ...input,
        receiptUploadToken: 'token',
      }),
    ).rejects.toBeInstanceOf(ChargeReceiptInvalidError)
    expect(repository.registerPayment).not.toHaveBeenCalled()
  })

  it('recusa token emitido para outra cobrança', async () => {
    const tickets = createTickets({
      verify: vi.fn().mockResolvedValue({ ...receiptDescriptor, chargeId: 'outra' }),
    })

    await expect(
      new RegisterChargePaymentUseCase(createRepository(), createStorage(), tickets).execute({
        ...input,
        receiptUploadToken: 'token',
      }),
    ).rejects.toMatchObject({ status: 403 })
  })

  it.each(['PAID', 'CANCELED'] as const)('não paga cobrança %s', async (storedStatus) => {
    const repository = createRepository({
      findById: vi.fn().mockResolvedValue(storedCharge({ storedStatus })),
    })

    await expect(
      new RegisterChargePaymentUseCase(repository, createStorage(), createTickets()).execute(input),
    ).rejects.toBeInstanceOf(ChargeAlreadySettledError)
  })
})

describe('ReverseChargePaymentUseCase e CancelChargeUseCase', () => {
  it('estorna só cobrança paga, com o motivo', async () => {
    const repository = createRepository({
      findById: vi.fn().mockResolvedValue(storedCharge({ storedStatus: 'PAID' })),
    })

    await new ReverseChargePaymentUseCase(repository).execute({
      ...owner,
      chargeId: 'charge-1',
      reason: 'Pix devolvido',
    })

    expect(repository.reversePayment).toHaveBeenCalledWith(
      expect.objectContaining({ storedStatus: 'PAID' }),
      'Pix devolvido',
      { tenantId: 'tenant-1', actorId: 'owner-1' },
    )
    await expect(
      new ReverseChargePaymentUseCase(createRepository()).execute({
        ...owner,
        chargeId: 'charge-1',
        reason: 'x',
      }),
    ).rejects.toBeInstanceOf(ChargeNotPaidError)
  })

  it('cancela em aberto e não reabre cancelada', async () => {
    const repository = createRepository()

    await new CancelChargeUseCase(repository).execute({
      ...owner,
      chargeId: 'charge-1',
      reason: 'Lançada em duplicidade',
    })
    expect(repository.cancel).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'charge-1' }),
      'Lançada em duplicidade',
      { tenantId: 'tenant-1', actorId: 'owner-1' },
    )

    const cancelled = createRepository({
      findById: vi.fn().mockResolvedValue(storedCharge({ storedStatus: 'CANCELED' })),
    })
    await expect(
      new CancelChargeUseCase(cancelled).execute({ ...owner, chargeId: 'charge-1', reason: 'x' }),
    ).rejects.toBeInstanceOf(ChargeAlreadySettledError)
  })
})

describe('DeleteChargeUseCase', () => {
  it('exclui cobrança em aberto sem movimento', async () => {
    const repository = createRepository()

    await new DeleteChargeUseCase(repository).execute({ ...owner, chargeId: 'charge-1' })

    expect(repository.delete).toHaveBeenCalledWith(expect.objectContaining({ id: 'charge-1' }), {
      tenantId: 'tenant-1',
      actorId: 'owner-1',
    })
  })

  it('não exclui cobrança que já teve movimento', async () => {
    const repository = createRepository({ hasMovement: vi.fn().mockResolvedValue(true) })

    await expect(
      new DeleteChargeUseCase(repository).execute({ ...owner, chargeId: 'charge-1' }),
    ).rejects.toBeInstanceOf(ChargeHasMovementError)
    expect(repository.delete).not.toHaveBeenCalled()
  })
})

describe('InitChargeReceiptUploadUseCase', () => {
  it('gera URL e token só para cobrança em aberto', async () => {
    const storage = createStorage()
    const tickets = createTickets()

    const upload = await new InitChargeReceiptUploadUseCase(createRepository(), storage, tickets, {
      generate: () => 'receipt-1',
    }).execute({
      ...owner,
      chargeId: 'charge-1',
      name: 'comprovante.pdf',
      contentType: 'application/pdf',
      size: 1200,
      sha256: 'a'.repeat(64),
    })

    expect(upload).toMatchObject({ uploadUrl: 'https://s3/upload', uploadToken: 'upload-token' })
    expect(storage.uploadLocation).toHaveBeenCalledWith(
      'financial/tenant-1/charge-1/receipt-1.pdf',
      expect.objectContaining({ id: 'receipt-1', actorId: 'owner-1' }),
    )
    expect(tickets.issue).toHaveBeenCalledWith(receiptDescriptor)
  })
})

describe('DownloadChargeReceiptUseCase', () => {
  const stored = {
    id: 'receipt-1',
    tenantId: 'tenant-1',
    chargeId: 'charge-1',
    objectKey: 'financial/tenant-1/charge-1/receipt-1.pdf',
    name: 'comprovante.pdf',
    contentType: 'application/pdf',
    size: 1200,
    sha256: 'a'.repeat(64),
  }

  it('o OWNER pode baixar comprovantes antigos; os outros só o vigente', async () => {
    const repository = createRepository({ findReceipt: vi.fn().mockResolvedValue(stored) })
    const useCase = new DownloadChargeReceiptUseCase(repository, createStorage())

    await useCase.execute({ ...owner, chargeId: 'charge-1', receiptId: 'receipt-1' })
    await useCase.execute({
      actorId: 'renter-1',
      actorTenantId: 'renters',
      actorRole: 'RENTER',
      chargeId: 'charge-1',
      receiptId: 'receipt-1',
    })

    expect(vi.mocked(repository.findReceipt).mock.calls.map((call) => call[3])).toEqual([
      true,
      false,
    ])
  })

  it('devolve 404 quando o comprovante não está no escopo', async () => {
    await expect(
      new DownloadChargeReceiptUseCase(createRepository(), createStorage()).execute({
        ...owner,
        chargeId: 'charge-1',
        receiptId: 'x',
      }),
    ).rejects.toBeInstanceOf(ChargeReceiptNotFoundError)
  })

  it('recusa arquivo adulterado no armazenamento', async () => {
    const repository = createRepository({ findReceipt: vi.fn().mockResolvedValue(stored) })
    const storage = createStorage({
      inspect: vi.fn().mockResolvedValue({
        size: 1200,
        contentType: 'application/pdf',
        sha256: 'b'.repeat(64),
        signature: new Uint8Array(),
      }),
    })

    await expect(
      new DownloadChargeReceiptUseCase(repository, storage).execute({
        ...owner,
        chargeId: 'charge-1',
        receiptId: 'receipt-1',
      }),
    ).rejects.toBeInstanceOf(ChargeReceiptInvalidError)
  })
})

describe('GetFinancialSummaryUseCase', () => {
  it('consulta com o dia de São Paulo e marca os próximos vencimentos atrasados', async () => {
    const repository = createRepository({
      getSummary: vi.fn().mockResolvedValue({
        monthlyReceivable: 10,
        overdueTotal: 5,
        defaultRatePercentage: 50,
        occupancyRatePercentage: 0,
        monthlySeries: [],
        upcomingDues: [
          {
            id: 'c',
            code: 'COB',
            description: null,
            payerName: null,
            propertyId: null,
            propertyTitle: null,
            dueDate: new Date('2026-10-01T00:00:00.000Z'),
            amount: 5,
            storedStatus: 'PENDING',
          },
        ],
      }),
    })

    const summary = await new GetFinancialSummaryUseCase(repository, clock).execute(owner)

    expect(repository.getSummary).toHaveBeenCalledWith('tenant-1', { year: 2026, month: 9 }, today)
    expect(summary.upcomingDues[0].status).toBe('OVERDUE')
  })
})

describe('ExportChargesUseCase', () => {
  it('exporta o mês com o status efetivo, só para o OWNER', async () => {
    const repository = createRepository({ findForExport: vi.fn().mockResolvedValue([overdue]) })
    const useCase = new ExportChargesUseCase(repository, clock)

    const file = await useCase.execute({
      ...owner,
      month: { year: 2026, month: 9 },
      locale: 'pt-BR',
    })

    expect(repository.findForExport).toHaveBeenCalledWith('tenant-1', { year: 2026, month: 9 })
    expect(file.fileName).toBe('cobrancas-2026-10.csv')
    expect(file.content).toContain(
      'COB-2026-0001;Aluguel avulso;;;A receber;20/10/2026;2500,00;Atrasada;;',
    )
    await expect(
      useCase.execute({
        ...owner,
        actorRole: 'AGENT',
        month: { year: 2026, month: 9 },
        locale: 'pt-BR',
      }),
    ).rejects.toMatchObject({ status: 403 })
  })

  it('usa o mês escolhido no resumo', async () => {
    const repository = createRepository()

    await new GetFinancialSummaryUseCase(repository, clock).execute({
      ...owner,
      month: { year: 2026, month: 4 },
    })

    expect(repository.getSummary).toHaveBeenCalledWith('tenant-1', { year: 2026, month: 4 }, today)
  })
})
