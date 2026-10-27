import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { prisma } from '@server/db/prisma'

import { GET } from '../../agencies/route'

const marker = randomUUID().slice(0, 8)

function request(search = '') {
  return new NextRequest(`http://localhost/api/marketplace/agencies${search}`)
}

describe('GET /api/marketplace/agencies (integração)', () => {
  let publishedTenantId: string
  let draftTenantId: string

  beforeAll(async () => {
    const publishedTenant = await prisma.tenant.create({
      data: { nome: 'Imobiliária Publicada', slug: `diretorio-agencia-publicada-${randomUUID()}` },
    })
    publishedTenantId = publishedTenant.id
    await prisma.perfilPublicoImobiliaria.create({
      data: {
        tenantId: publishedTenantId,
        displayName: `Imobiliária Publicada ${marker}`,
        status: 'PUBLISHED',
        publicadoEm: new Date(),
      },
    })

    const draftTenant = await prisma.tenant.create({
      data: { nome: 'Imobiliária Rascunho', slug: `diretorio-agencia-rascunho-${randomUUID()}` },
    })
    draftTenantId = draftTenant.id
    await prisma.perfilPublicoImobiliaria.create({
      data: { tenantId: draftTenantId, displayName: 'Imobiliária Rascunho', status: 'DRAFT' },
    })
  })

  afterAll(async () => {
    await prisma.tenant.delete({ where: { id: publishedTenantId } })
    await prisma.tenant.delete({ where: { id: draftTenantId } })
    await prisma.$disconnect()
  })

  it('lista só perfis publicados e devolve a paginação', async () => {
    const response = await GET(request(`?q=${marker}`))
    const json = await response.json()

    expect(response.status).toBe(200)
    const ids = json.agencies.map((item: { id: string }) => item.id)
    expect(ids).toEqual([publishedTenantId])
    expect(ids).not.toContain(draftTenantId)
    expect(json).toMatchObject({ totalCount: 1, page: 1, pageSize: 12 })
  })

  it('busca sem diferenciar acentos e maiúsculas', async () => {
    const response = await GET(
      request(`?q=${encodeURIComponent('IMOBILIARIA PUBLICADA ' + marker)}`),
    )
    const json = await response.json()

    expect(json.agencies.map((item: { id: string }) => item.id)).toEqual([publishedTenantId])
  })

  it('rejeita parâmetros desconhecidos ou fora do limite', async () => {
    expect((await GET(request('?pageSize=500'))).status).toBe(400)
    expect((await GET(request('?foo=1'))).status).toBe(400)
  })
})
