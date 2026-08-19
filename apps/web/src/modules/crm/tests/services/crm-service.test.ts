import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { HttpClient } from '@shared/lib/api/http-client'

import type { Opportunity } from '../../types/opportunity'
import { CrmService } from '../../services/crm-service'

const opportunity: Opportunity = {
  id: 'opportunity-1',
  tenantId: 'tenant-1',
  imovelId: 'property-1',
  interessadoNome: 'Maria Silva',
  interessadoEmail: 'maria@example.com',
  interessadoTelefone: null,
  valorProposto: 4800,
  prazoContratoMeses: null,
  inicioPretendido: null,
  garantiaContratual: 'NENHUMA',
  condicoesEspeciais: [],
  observacoes: null,
  status: 'ENVIADA',
  arquivadaEm: null,
  createdAt: '2026-08-12T10:00:00.000Z',
  updatedAt: '2026-08-12T10:00:00.000Z',
}

const property = {
  id: 'property-1',
  titulo: 'Apartamento Jardins',
  finalidade: 'ALUGUEL' as const,
  tipo: 'apartamento',
  valor: 4800,
  condominio: 900,
  iptu: null,
  quartos: 2,
  banheiros: 2,
  vagas: 1,
  areaM2: 84,
  cidade: 'Sao Paulo',
  bairro: 'Jardins',
  capaUrl: null,
  publicadoEm: '2026-08-12T10:00:00.000Z',
}

describe('CrmService', () => {
  const http = {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  }
  let service: CrmService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new CrmService(http as unknown as HttpClient)
  })

  it('lists opportunities with the API-supported filters', async () => {
    http.get.mockResolvedValueOnce({ inquiries: [opportunity] })

    await expect(service.list({ status: 'EM_NEGOCIACAO', includeArchived: true })).resolves.toEqual(
      [opportunity],
    )
    expect(http.get).toHaveBeenCalledWith('/marketplace/inquiries', {
      params: { status: 'EM_NEGOCIACAO', includeArchived: 'true' },
    })
  })

  it('gets one opportunity and unwraps the response', async () => {
    http.get.mockResolvedValueOnce({ inquiry: opportunity })

    await expect(service.getById(opportunity.id)).resolves.toEqual(opportunity)
    expect(http.get).toHaveBeenCalledWith(`/marketplace/inquiries/${opportunity.id}`)
  })

  it('updates one opportunity with PATCH', async () => {
    const updated = { ...opportunity, status: 'ACEITA' as const }
    http.patch.mockResolvedValueOnce({ inquiry: updated })

    await expect(service.update(opportunity.id, { status: 'ACEITA' })).resolves.toEqual(updated)
    expect(http.patch).toHaveBeenCalledWith(`/marketplace/inquiries/${opportunity.id}`, {
      status: 'ACEITA',
    })
  })

  it('archives one opportunity with the non-permanent DELETE endpoint', async () => {
    const archived = { ...opportunity, arquivadaEm: '2026-08-12T12:00:00.000Z' }
    http.delete.mockResolvedValueOnce({ inquiry: archived })

    await expect(service.archive(opportunity.id)).resolves.toEqual(archived)
    expect(http.delete).toHaveBeenCalledWith(`/marketplace/inquiries/${opportunity.id}`)
  })

  it('lists public properties through the existing marketplace endpoint', async () => {
    http.get.mockResolvedValueOnce({ properties: [property] })
    const filters = { finalidade: 'ALUGUEL' as const, q: 'Jardins' }

    await expect(service.listProperties(filters)).resolves.toEqual([property])
    expect(http.get).toHaveBeenCalledWith('/marketplace/properties', { params: filters })
  })

  it('gets public property detail through the existing marketplace endpoint', async () => {
    const detail = { ...property, descricao: null, endereco: null, midias: [] }
    http.get.mockResolvedValueOnce({ property: detail })

    await expect(service.getProperty(property.id)).resolves.toEqual(detail)
    expect(http.get).toHaveBeenCalledWith(`/marketplace/properties/${property.id}`)
  })
})
