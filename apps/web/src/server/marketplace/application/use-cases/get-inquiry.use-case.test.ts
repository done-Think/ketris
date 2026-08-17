import { describe, expect, it, vi } from 'vitest'

import { InquiryNotFoundError } from '../../domain/errors'
import type { Inquiry } from '../../domain/inquiry.entity'
import type { InquiryRepository } from '../ports/inquiry-repository.port'
import { GetInquiryUseCase } from './get-inquiry.use-case'

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

function createDeps(findById?: InquiryRepository['findById']) {
  const inquiryRepository: InquiryRepository = {
    create: vi.fn(),
    findManyByTenant: vi.fn(),
    findById: findById ?? vi.fn().mockResolvedValue(inquiry),
    update: vi.fn(),
    archive: vi.fn(),
    delete: vi.fn(),
  }

  return { inquiryRepository }
}

describe('GetInquiryUseCase', () => {
  it('retorna a proposta quando pertence ao tenant do ator', async () => {
    const deps = createDeps()
    const useCase = new GetInquiryUseCase(deps.inquiryRepository)

    const result = await useCase.execute({ actorTenantId: 'tenant-1', inquiryId: 'oportunidade-1' })

    expect(result.id).toBe('oportunidade-1')
  })

  it('lança InquiryNotFoundError quando a proposta não existe', async () => {
    const deps = createDeps(vi.fn().mockResolvedValue(null))
    const useCase = new GetInquiryUseCase(deps.inquiryRepository)

    await expect(
      useCase.execute({ actorTenantId: 'tenant-1', inquiryId: 'inexistente' }),
    ).rejects.toThrow(InquiryNotFoundError)
  })

  it('lança InquiryNotFoundError (opaco) quando a proposta é de outro tenant', async () => {
    const deps = createDeps(vi.fn().mockResolvedValue({ ...inquiry, tenantId: 'tenant-2' }))
    const useCase = new GetInquiryUseCase(deps.inquiryRepository)

    await expect(
      useCase.execute({ actorTenantId: 'tenant-1', inquiryId: 'oportunidade-1' }),
    ).rejects.toThrow(InquiryNotFoundError)
  })
})
