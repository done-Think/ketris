import { describe, expect, it, vi } from 'vitest'

import { InquiryNotFoundError } from '../../domain/errors'
import type { Inquiry } from '../../domain/inquiry.entity'
import type { InquiryRepository } from '../ports/inquiry-repository.port'
import { ArchiveInquiryUseCase } from './archive-inquiry.use-case'

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
  archive?: InquiryRepository['archive']
}) {
  const inquiryRepository: InquiryRepository = {
    create: vi.fn(),
    findManyByTenant: vi.fn(),
    findById: overrides?.findById ?? vi.fn().mockResolvedValue(inquiry),
    update: vi.fn(),
    archive:
      overrides?.archive ??
      vi.fn().mockResolvedValue({ ...inquiry, arquivadaEm: new Date('2026-08-11T00:00:00.000Z') }),
    delete: vi.fn(),
  }

  return { inquiryRepository }
}

describe('ArchiveInquiryUseCase', () => {
  it('arquiva (soft delete) a proposta do tenant do ator', async () => {
    const archive = vi
      .fn()
      .mockResolvedValue({ ...inquiry, arquivadaEm: new Date('2026-08-11T00:00:00.000Z') })
    const deps = createDeps({ archive })
    const useCase = new ArchiveInquiryUseCase(deps.inquiryRepository)

    const result = await useCase.execute({ actorTenantId: 'tenant-1', inquiryId: 'oportunidade-1' })

    expect(archive).toHaveBeenCalledWith('oportunidade-1')
    expect(result.arquivadaEm).not.toBeNull()
  })

  it('lança InquiryNotFoundError e não arquiva quando a proposta é de outro tenant', async () => {
    const archive = vi.fn()
    const deps = createDeps({
      findById: vi.fn().mockResolvedValue({ ...inquiry, tenantId: 'tenant-2' }),
      archive,
    })
    const useCase = new ArchiveInquiryUseCase(deps.inquiryRepository)

    await expect(
      useCase.execute({ actorTenantId: 'tenant-1', inquiryId: 'oportunidade-1' }),
    ).rejects.toThrow(InquiryNotFoundError)
    expect(archive).not.toHaveBeenCalled()
  })
})
