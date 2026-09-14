import { describe, expect, it, vi } from 'vitest'

import type { Inquiry } from '../../domain/inquiry.entity'
import type { InquiryRepository } from '../ports/inquiry-repository.port'
import { ListInquiriesUseCase } from './list-inquiries.use-case'

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

function createDeps(findManyByTenant?: InquiryRepository['findManyByTenant']) {
  const inquiryRepository: InquiryRepository = {
    create: vi.fn(),
    findManyByTenant: findManyByTenant ?? vi.fn().mockResolvedValue([inquiry]),
    findById: vi.fn(),
    update: vi.fn(),
    archive: vi.fn(),
    delete: vi.fn(),
  }

  return { inquiryRepository }
}

describe('ListInquiriesUseCase', () => {
  it('lista as propostas do tenant do ator, repassando os filtros', async () => {
    const findManyByTenant = vi.fn().mockResolvedValue([inquiry])
    const deps = createDeps(findManyByTenant)
    const useCase = new ListInquiriesUseCase(deps.inquiryRepository)

    const result = await useCase.execute({
      actorTenantId: 'tenant-1',
      status: 'ENVIADA',
      includeArchived: false,
    })

    expect(findManyByTenant).toHaveBeenCalledWith('tenant-1', {
      status: 'ENVIADA',
      includeArchived: false,
    })
    expect(result).toEqual([inquiry])
  })
})
