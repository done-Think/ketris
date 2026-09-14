import { describe, expect, it, vi } from 'vitest'

import { InquiryNotFoundError } from '../../domain/errors'
import type { Inquiry } from '../../domain/inquiry.entity'
import type { InquiryRepository } from '../ports/inquiry-repository.port'
import { DeleteInquiryUseCase } from './delete-inquiry.use-case'

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
  deleteFn?: InquiryRepository['delete']
}) {
  const inquiryRepository: InquiryRepository = {
    create: vi.fn(),
    findManyByTenant: vi.fn(),
    findById: overrides?.findById ?? vi.fn().mockResolvedValue(inquiry),
    update: vi.fn(),
    archive: vi.fn(),
    delete: overrides?.deleteFn ?? vi.fn().mockResolvedValue(undefined),
  }

  return { inquiryRepository }
}

describe('DeleteInquiryUseCase', () => {
  it('exclui permanentemente a proposta do tenant do ator', async () => {
    const deleteFn = vi.fn().mockResolvedValue(undefined)
    const deps = createDeps({ deleteFn })
    const useCase = new DeleteInquiryUseCase(deps.inquiryRepository)

    await useCase.execute({ actorTenantId: 'tenant-1', inquiryId: 'oportunidade-1' })

    expect(deleteFn).toHaveBeenCalledWith('oportunidade-1')
  })

  it('lança InquiryNotFoundError e não exclui quando a proposta é de outro tenant', async () => {
    const deleteFn = vi.fn()
    const deps = createDeps({
      findById: vi.fn().mockResolvedValue({ ...inquiry, tenantId: 'tenant-2' }),
      deleteFn,
    })
    const useCase = new DeleteInquiryUseCase(deps.inquiryRepository)

    await expect(
      useCase.execute({ actorTenantId: 'tenant-1', inquiryId: 'oportunidade-1' }),
    ).rejects.toThrow(InquiryNotFoundError)
    expect(deleteFn).not.toHaveBeenCalled()
  })
})
