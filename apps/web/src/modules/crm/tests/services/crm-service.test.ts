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
    http.get.mockResolvedValueOnce({ opportunities: [opportunity] })

    await expect(service.list({ status: 'EM_NEGOCIACAO', includeArchived: true })).resolves.toEqual(
      [opportunity],
    )
    expect(http.get).toHaveBeenCalledWith('/crm/opportunities', {
      params: { status: 'EM_NEGOCIACAO', includeArchived: 'true' },
    })
  })

  it('gets one opportunity and unwraps the response', async () => {
    http.get.mockResolvedValueOnce({ opportunity: opportunity })

    await expect(service.getById(opportunity.id)).resolves.toEqual(opportunity)
    expect(http.get).toHaveBeenCalledWith(`/crm/opportunities/${opportunity.id}`)
  })

  it('creates an opportunity manually and unwraps the response', async () => {
    http.post.mockResolvedValueOnce({ opportunity })

    await expect(
      service.create({
        imovelId: opportunity.imovelId,
        interessadoNome: opportunity.interessadoNome,
        interessadoEmail: opportunity.interessadoEmail,
        valorProposto: opportunity.valorProposto,
      }),
    ).resolves.toEqual(opportunity)
    expect(http.post).toHaveBeenCalledWith('/crm/opportunities', {
      imovelId: opportunity.imovelId,
      interessadoNome: opportunity.interessadoNome,
      interessadoEmail: opportunity.interessadoEmail,
      valorProposto: opportunity.valorProposto,
    })
  })

  it('updates one opportunity with PATCH', async () => {
    const updated = { ...opportunity, status: 'ACEITA' as const }
    http.patch.mockResolvedValueOnce({ opportunity: updated })

    await expect(service.update(opportunity.id, { status: 'ACEITA' })).resolves.toEqual(updated)
    expect(http.patch).toHaveBeenCalledWith(`/crm/opportunities/${opportunity.id}`, {
      status: 'ACEITA',
    })
  })

  it('archives one opportunity with the non-permanent DELETE endpoint', async () => {
    const archived = { ...opportunity, arquivadaEm: '2026-08-12T12:00:00.000Z' }
    http.delete.mockResolvedValueOnce({ opportunity: archived })

    await expect(service.archive(opportunity.id)).resolves.toEqual(archived)
    expect(http.delete).toHaveBeenCalledWith(`/crm/opportunities/${opportunity.id}`)
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

  it('responds to an opportunity and returns both the opportunity and the logged activity', async () => {
    const accepted = { ...opportunity, status: 'ACEITA' as const }
    const activity = {
      id: 'activity-1',
      oportunidadeId: opportunity.id,
      tipo: 'PROPOSTA_RESPONDIDA' as const,
      descricao: 'Proposta aceita.',
      autorId: null,
      autorNome: null,
      statusAnterior: 'ENVIADA' as const,
      statusNovo: 'ACEITA' as const,
      createdAt: '2026-08-12T12:00:00.000Z',
    }
    http.post.mockResolvedValueOnce({ opportunity: accepted, activity })

    await expect(service.respond(opportunity.id, { action: 'ACEITAR' })).resolves.toEqual({
      opportunity: accepted,
      activity,
    })
    expect(http.post).toHaveBeenCalledWith(`/crm/opportunities/${opportunity.id}/respond`, {
      action: 'ACEITAR',
    })
  })

  it('lists the opportunity activity timeline', async () => {
    http.get.mockResolvedValueOnce({ activities: [] })

    await expect(service.listActivities(opportunity.id)).resolves.toEqual([])
    expect(http.get).toHaveBeenCalledWith(`/crm/opportunities/${opportunity.id}/activities`)
  })

  it('adds a manual note to the opportunity timeline', async () => {
    const note = {
      id: 'activity-2',
      oportunidadeId: opportunity.id,
      tipo: 'NOTA' as const,
      descricao: 'Ligou para confirmar a visita.',
      autorId: null,
      autorNome: null,
      statusAnterior: null,
      statusNovo: null,
      createdAt: '2026-08-12T12:00:00.000Z',
    }
    http.post.mockResolvedValueOnce({ activity: note })

    await expect(
      service.addNote(opportunity.id, 'Ligou para confirmar a visita.'),
    ).resolves.toEqual(note)
    expect(http.post).toHaveBeenCalledWith(`/crm/opportunities/${opportunity.id}/activities`, {
      descricao: 'Ligou para confirmar a visita.',
    })
  })
})
