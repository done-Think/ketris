import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { prisma } from '@server/db/prisma'

import { GET } from '../route'

describe('GET /api/tenants/search (integração)', () => {
  const marker = randomUUID().slice(0, 8)
  let tenantId: string

  beforeAll(async () => {
    await prisma.tenant.upsert({
      where: { slug: 'locatarios' },
      update: {},
      create: { nome: 'Locatários Ketris', slug: 'locatarios' },
    })

    const tenant = await prisma.tenant.create({
      data: { nome: `Imobiliária Buscável ${marker}`, slug: `imobiliaria-buscavel-${marker}` },
    })
    tenantId = tenant.id
  })

  afterAll(async () => {
    await prisma.tenant.delete({ where: { id: tenantId } })
    await prisma.$disconnect()
  })

  function buildRequest(query: string): NextRequest {
    return new NextRequest(`http://localhost/api/tenants/search?q=${encodeURIComponent(query)}`)
  }

  it('encontra o tenant pelo nome (case-insensitive)', async () => {
    const response = await GET(buildRequest(`buscável ${marker}`))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.tenants).toEqual([{ id: tenantId, name: `Imobiliária Buscável ${marker}` }])
  })

  it('nunca retorna o tenant compartilhado de locatários', async () => {
    const response = await GET(buildRequest('locatários'))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(
      json.tenants.some((tenant: { name: string }) => tenant.name === 'Locatários Ketris'),
    ).toBe(false)
  })

  it('retorna 400 quando o parâmetro q está ausente', async () => {
    const response = await GET(new NextRequest('http://localhost/api/tenants/search'))
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error.code).toBe('VALIDATION_ERROR')
  })
})
