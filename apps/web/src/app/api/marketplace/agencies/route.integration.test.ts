import { randomUUID } from 'node:crypto'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { prisma } from '@server/db/prisma'

import { GET } from './route'

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
        displayName: 'Imobiliária Publicada',
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

  it('lista só imobiliárias com perfil publicado', async () => {
    const response = await GET()
    const json = await response.json()

    expect(response.status).toBe(200)
    const ids = json.agencies.map((agency: { id: string }) => agency.id)
    expect(ids).toContain(publishedTenantId)
    expect(ids).not.toContain(draftTenantId)
  })
})
