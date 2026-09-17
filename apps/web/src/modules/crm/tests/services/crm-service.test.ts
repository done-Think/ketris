import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { HttpClient } from '@shared/lib/api/http-client'

import type { Opportunity } from '../../types/opportunity'
import { CrmService } from '../../services/crm-service'

const opportunity: Opportunity = {
  id: 'opportunity-1',
  tenantId: 'tenant-1',
  propertyId: 'property-1',
  leadName: 'Maria Silva',
  leadEmail: 'maria@example.com',
  leadPhone: null,
  proposedValue: 4800,
  contractTermMonths: null,
  desiredStartDate: null,
  guaranteeType: 'NENHUMA',
  specialConditions: [],
  notes: null,
  status: 'ENVIADA',
  archivedAt: null,
  createdAt: '2026-08-12T10:00:00.000Z',
  updatedAt: '2026-08-12T10:00:00.000Z',
}

const property = {
  id: 'property-1',
  title: 'Apartamento Jardins',
  purpose: 'ALUGUEL' as const,
  propertyType: 'apartamento',
  price: 4800,
  condoFee: 900,
  propertyTax: null,
  bedrooms: 2,
  bathrooms: 2,
  parkingSpots: 1,
  area: 84,
  city: 'Sao Paulo',
  neighborhood: 'Jardins',
  coverUrl: null,
  publishedAt: '2026-08-12T10:00:00.000Z',
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
        propertyId: opportunity.propertyId,
        leadName: opportunity.leadName,
        leadEmail: opportunity.leadEmail,
        proposedValue: opportunity.proposedValue,
      }),
    ).resolves.toEqual(opportunity)
    expect(http.post).toHaveBeenCalledWith('/crm/opportunities', {
      propertyId: opportunity.propertyId,
      leadName: opportunity.leadName,
      leadEmail: opportunity.leadEmail,
      proposedValue: opportunity.proposedValue,
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
    const archived = { ...opportunity, archivedAt: '2026-08-12T12:00:00.000Z' }
    http.delete.mockResolvedValueOnce({ opportunity: archived })

    await expect(service.archive(opportunity.id)).resolves.toEqual(archived)
    expect(http.delete).toHaveBeenCalledWith(`/crm/opportunities/${opportunity.id}`)
  })

  it('lists public properties through the existing marketplace endpoint', async () => {
    http.get.mockResolvedValueOnce({ properties: [property] })
    const filters = { purpose: 'ALUGUEL' as const, q: 'Jardins' }

    await expect(service.listProperties(filters)).resolves.toEqual([property])
    expect(http.get).toHaveBeenCalledWith('/marketplace/properties', { params: filters })
  })

  it('gets public property detail through the existing marketplace endpoint', async () => {
    const detail = { ...property, description: null, address: null, media: [] }
    http.get.mockResolvedValueOnce({ property: detail })

    await expect(service.getProperty(property.id)).resolves.toEqual(detail)
    expect(http.get).toHaveBeenCalledWith(`/marketplace/properties/${property.id}`)
  })

  it('responds to an opportunity and returns both the opportunity and the logged activity', async () => {
    const accepted = { ...opportunity, status: 'ACEITA' as const }
    const activity = {
      id: 'activity-1',
      opportunityId: opportunity.id,
      type: 'PROPOSTA_RESPONDIDA' as const,
      description: 'Proposta aceita.',
      authorId: null,
      authorName: null,
      previousStatus: 'ENVIADA' as const,
      newStatus: 'ACEITA' as const,
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
      opportunityId: opportunity.id,
      type: 'NOTA' as const,
      description: 'Ligou para confirmar a visita.',
      authorId: null,
      authorName: null,
      previousStatus: null,
      newStatus: null,
      createdAt: '2026-08-12T12:00:00.000Z',
    }
    http.post.mockResolvedValueOnce({ activity: note })

    await expect(
      service.addNote(opportunity.id, 'Ligou para confirmar a visita.'),
    ).resolves.toEqual(note)
    expect(http.post).toHaveBeenCalledWith(`/crm/opportunities/${opportunity.id}/activities`, {
      description: 'Ligou para confirmar a visita.',
    })
  })
})
