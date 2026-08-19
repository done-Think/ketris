import { describe, expect, it, vi } from 'vitest'

import { InquiryNotFoundError } from '../../domain/errors'
import type { Inquiry } from '../../domain/inquiry.entity'
import type { InquiryRepository } from '../ports/inquiry-repository.port'
import { UpdateInquiryUseCase } from './update-inquiry.use-case'

const inquiry: Inquiry = {
  id: 'oportunidade-1',
  tenantId: 'tenant-1',
  imovelId: 'imovel-1',
  interessadoNome: 'Maria',
  interessadoEmail: 'maria@exemplo.com',
  interessadoTelefone: null,
  valorProposto: 2500,
  prazoContratoMeses: null,
  inicioPretendido: null,
  garantiaContratual: 'NENHUMA',
  condicoesEspeciais: [],
  observacoes: null,
  status: 'ENVIADA',
  arquivadaEm: null,
  createdAt: new Date('2026-08-10T00:00:00.000Z'),
  updatedAt: new Date('2026-08-10T00:00:00.000Z'),
}

function createDeps(overrides?: {
  findById?: InquiryRepository['findById']
  update?: InquiryRepository['update']
}) {
  const inquiryRepository: InquiryRepository = {
    create: vi.fn(),
    findManyByTenant: vi.fn(),
    findById: overrides?.findById ?? vi.fn().mockResolvedValue(inquiry),
    update: overrides?.update ?? vi.fn().mockResolvedValue({ ...inquiry, status: 'EM_NEGOCIACAO' }),
    archive: vi.fn(),
    delete: vi.fn(),
  }

  return { inquiryRepository }
}

describe('UpdateInquiryUseCase', () => {
  it('atualiza a proposta do tenant do ator repassando as mudanças', async () => {
    const update = vi.fn().mockResolvedValue({ ...inquiry, status: 'EM_NEGOCIACAO' })
    const deps = createDeps({ update })
    const useCase = new UpdateInquiryUseCase(deps.inquiryRepository)

    const result = await useCase.execute({
      actorTenantId: 'tenant-1',
      inquiryId: 'oportunidade-1',
      changes: { status: 'EM_NEGOCIACAO' },
    })

    expect(update).toHaveBeenCalledWith('oportunidade-1', { status: 'EM_NEGOCIACAO' })
    expect(result.status).toBe('EM_NEGOCIACAO')
  })

  it('lança InquiryNotFoundError e não atualiza quando a proposta é de outro tenant', async () => {
    const update = vi.fn()
    const deps = createDeps({
      findById: vi.fn().mockResolvedValue({ ...inquiry, tenantId: 'tenant-2' }),
      update,
    })
    const useCase = new UpdateInquiryUseCase(deps.inquiryRepository)

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        inquiryId: 'oportunidade-1',
        changes: { status: 'ACEITA' },
      }),
    ).rejects.toThrow(InquiryNotFoundError)
    expect(update).not.toHaveBeenCalled()
  })
})
