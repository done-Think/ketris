import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { prisma } from '@server/db/prisma'
import { inquiryContactRateLimitKey } from '@server/marketplace/infrastructure/inquiry-rate-limit'

import { POST } from '../../../../properties/[id]/inquiries/route'

describe('POST /api/marketplace/properties/[id]/inquiries (integração)', () => {
  let tenantId: string
  let publishedId: string
  let draftId: string
  let responsibleId: string
  const quotaEmail = `http-quota-${randomUUID()}@example.test`

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { name: 'Imobiliária Inquiry', slug: `mkt-inquiry-${randomUUID()}` },
    })
    tenantId = tenant.id

    const responsible = await prisma.user.create({
      data: {
        tenantId,
        name: 'Corretor',
        email: `corretor-${randomUUID()}@ketris.dev`,
        passwordHash: 'hash-fake',
        role: 'AGENT',
      },
    })
    responsibleId = responsible.id

    const published = await prisma.property.create({
      data: {
        tenantId,
        responsibleId: responsible.id,
        title: 'Sala comercial publicada',
        purpose: 'RENT',
        type: 'COMMERCIAL',
        price: 1800,
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    })
    publishedId = published.id

    const draft = await prisma.property.create({
      data: {
        tenantId,
        responsibleId: responsible.id,
        title: 'Sala em rascunho',
        purpose: 'RENT',
        type: 'COMMERCIAL',
        price: 2000,
        status: 'DRAFT',
      },
    })
    draftId = draft.id
  })

  afterAll(async () => {
    await prisma.authRateLimitBucket.deleteMany({
      where: {
        key: {
          in: ['maria@exemplo.com', quotaEmail].map(
            (email) =>
              `marketplace-property-contact:${inquiryContactRateLimitKey(publishedId, email)}`,
          ),
        },
      },
    })
    await prisma.tenant.delete({ where: { id: tenantId } })
    await prisma.$disconnect()
  })

  function buildRequest(id: string, body?: unknown): NextRequest {
    return new NextRequest(`http://localhost/api/marketplace/properties/${id}/inquiries`, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  it('creates a proposal and its linked lead in the property tenant for an anonymous visitor', async () => {
    const response = await POST(
      buildRequest(publishedId, {
        leadName: 'Maria Silva',
        leadEmail: 'maria@exemplo.com',
        leadPhone: '(41) 99999-9999',
        notes: 'Gostaria de agendar uma visita.',
      }),
      { params: Promise.resolve({ id: publishedId }) },
    )
    const json = await response.json()

    expect(response.status).toBe(201)
    expect(json.inquiry.status).toBe('SENT')
    expect(json.inquiry.propertyId).toBe(publishedId)

    const opportunity = await prisma.opportunity.findUnique({
      where: { id: json.inquiry.id },
    })
    expect(opportunity).not.toBeNull()
    expect(opportunity?.responsibleId).toBe(responsibleId)
    expect(opportunity?.tenantId).toBe(tenantId)
    expect(opportunity?.status).toBe('SENT')
    expect(opportunity?.interestedEmail).toBe('maria@exemplo.com')
    expect(opportunity?.proposedValue.toString()).toBe('1800')
    const lead = await prisma.lead.findUnique({ where: { opportunityId: json.inquiry.id } })
    expect(lead).toMatchObject({
      tenantId,
      responsibleId,
      propertyId: publishedId,
      source: 'MARKETPLACE',
      stage: 'PROPOSAL',
      name: 'Maria Silva',
      email: 'maria@exemplo.com',
      interest: 'Sala comercial publicada',
    })
    expect(await prisma.lead.count({ where: { opportunityId: json.inquiry.id } })).toBe(1)
  })

  it('retorna 404 e não cria oportunidade para um imóvel em rascunho', async () => {
    const response = await POST(
      buildRequest(draftId, {
        leadName: 'João',
        leadEmail: 'joao@exemplo.com',
      }),
      { params: Promise.resolve({ id: draftId }) },
    )
    const json = await response.json()

    expect(response.status).toBe(404)
    expect(json.error.code).toBe('PROPERTY_NOT_FOUND')

    const count = await prisma.opportunity.count({ where: { propertyId: draftId } })
    expect(count).toBe(0)
  })

  it('retorna 400 quando o corpo é inválido (e-mail ausente)', async () => {
    const response = await POST(buildRequest(publishedId, { leadName: 'Sem Email' }), {
      params: Promise.resolve({ id: publishedId }),
    })

    expect(response.status).toBe(400)
  })

  it('rejects a filled honeypot without creating a proposal', async () => {
    const before = await prisma.opportunity.count({ where: { propertyId: publishedId } })
    const response = await POST(
      buildRequest(publishedId, {
        leadName: 'Bot',
        leadEmail: 'bot@example.test',
        website: 'https://spam.example.test',
      }),
      { params: Promise.resolve({ id: publishedId }) },
    )
    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({ error: { code: 'INQUIRY_REJECTED' } })
    expect(await prisma.opportunity.count({ where: { propertyId: publishedId } })).toBe(before)
  })

  it('returns a retry window when the property/contact quota is exhausted', async () => {
    vi.stubEnv('MARKETPLACE_CONTACT_INQUIRY_LIMIT', '1')
    vi.stubEnv('MARKETPLACE_CONTACT_INQUIRY_WINDOW_MS', '60000')
    try {
      const first = await POST(
        buildRequest(publishedId, { leadName: 'Visitor', leadEmail: quotaEmail }),
        { params: Promise.resolve({ id: publishedId }) },
      )
      expect(first.status).toBe(201)
      const second = await POST(
        buildRequest(publishedId, { leadName: 'Visitor', leadEmail: quotaEmail.toUpperCase() }),
        { params: Promise.resolve({ id: publishedId }) },
      )
      expect(second.status).toBe(429)
      expect(await second.json()).toMatchObject({ error: { code: 'RATE_LIMIT_EXCEEDED' } })
      expect(Number(second.headers.get('Retry-After'))).toBeGreaterThan(0)
      expect(Number(second.headers.get('Retry-After'))).toBeLessThanOrEqual(60)
      expect(second.headers.get('Cache-Control')).toBe('no-store')
    } finally {
      vi.unstubAllEnvs()
    }
  })
})
