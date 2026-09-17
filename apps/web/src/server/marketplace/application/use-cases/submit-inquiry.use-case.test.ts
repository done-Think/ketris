import { describe, expect, it, vi } from 'vitest'

import { PropertyNotFoundError } from '../../domain/errors'
import type { CreatedInquiry } from '../../domain/inquiry.entity'
import type { PublishedPropertyDetail } from '../../domain/property.entity'
import type { InquiryRepository } from '../ports/inquiry-repository.port'
import type { PublicPropertyRepository } from '../ports/public-property-repository.port'
import { SubmitInquiryUseCase } from './submit-inquiry.use-case'

const detail: PublishedPropertyDetail = {
  id: 'imovel-1',
  tenantId: 'tenant-1',
  title: 'Apartamento no centro',
  purpose: 'ALUGUEL',
  propertyType: 'apartamento',
  price: 2500,
  condoFee: null,
  propertyTax: null,
  bedrooms: 2,
  bathrooms: 1,
  parkingSpots: 1,
  area: 60,
  city: 'Curitiba',
  neighborhood: 'Centro',
  latitude: null,
  longitude: null,
  brokerName: null,
  brokerAvatarUrl: null,
  coverUrl: null,
  publishedAt: new Date('2026-08-01T00:00:00.000Z'),
  description: null,
  address: null,
  media: [],
}

const created: CreatedInquiry = {
  id: 'oportunidade-1',
  propertyId: 'imovel-1',
  status: 'ENVIADA',
  createdAt: new Date('2026-08-10T00:00:00.000Z'),
}

function createDeps(overrides?: {
  findPublishedById?: PublicPropertyRepository['findPublishedById']
  create?: InquiryRepository['create']
}) {
  const propertyRepository: PublicPropertyRepository = {
    search: vi.fn(),
    findPublishedById: overrides?.findPublishedById ?? vi.fn().mockResolvedValue(detail),
  }
  const inquiryRepository: InquiryRepository = {
    create: overrides?.create ?? vi.fn().mockResolvedValue(created),
  }

  return { propertyRepository, inquiryRepository }
}

describe('SubmitInquiryUseCase', () => {
  it('cria a oportunidade no tenant do imóvel com os dados do interessado', async () => {
    const create = vi.fn().mockResolvedValue(created)
    const deps = createDeps({ create })
    const useCase = new SubmitInquiryUseCase(deps.propertyRepository, deps.inquiryRepository)

    const result = await useCase.execute({
      propertyId: 'imovel-1',
      leadName: 'Maria',
      leadEmail: 'maria@exemplo.com',
      leadPhone: '41999999999',
      notes: 'Tenho interesse em visitar',
    })

    expect(create).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      propertyId: 'imovel-1',
      leadName: 'Maria',
      leadEmail: 'maria@exemplo.com',
      leadPhone: '41999999999',
      proposedValue: 2500,
      notes: 'Tenho interesse em visitar',
    })
    expect(result).toEqual(created)
  })

  it('usa o valor anunciado do imóvel quando o interessado não propõe um valor', async () => {
    const create = vi.fn().mockResolvedValue(created)
    const deps = createDeps({ create })
    const useCase = new SubmitInquiryUseCase(deps.propertyRepository, deps.inquiryRepository)

    await useCase.execute({
      propertyId: 'imovel-1',
      leadName: 'Maria',
      leadEmail: 'maria@exemplo.com',
    })

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        proposedValue: 2500,
        leadPhone: null,
        notes: null,
      }),
    )
  })

  it('respeita o valor proposto quando o interessado informa um', async () => {
    const create = vi.fn().mockResolvedValue(created)
    const deps = createDeps({ create })
    const useCase = new SubmitInquiryUseCase(deps.propertyRepository, deps.inquiryRepository)

    await useCase.execute({
      propertyId: 'imovel-1',
      leadName: 'Maria',
      leadEmail: 'maria@exemplo.com',
      proposedValue: 2300,
    })

    expect(create).toHaveBeenCalledWith(expect.objectContaining({ proposedValue: 2300 }))
  })

  it('lança PropertyNotFoundError e não cria oportunidade quando o imóvel não está publicado', async () => {
    const create = vi.fn()
    const deps = createDeps({ findPublishedById: vi.fn().mockResolvedValue(null), create })
    const useCase = new SubmitInquiryUseCase(deps.propertyRepository, deps.inquiryRepository)

    await expect(
      useCase.execute({
        propertyId: 'inexistente',
        leadName: 'Maria',
        leadEmail: 'maria@exemplo.com',
      }),
    ).rejects.toThrow(PropertyNotFoundError)
    expect(create).not.toHaveBeenCalled()
  })
})
