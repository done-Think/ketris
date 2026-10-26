import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { prisma } from '@server/db/prisma'

import { GET } from '../../agencies/route'

describe('GET /api/marketplace/agencies (integração)', () => {
  // A token unique to this run: the directory is shared with every other test's agencies.
  const token = `bairro${randomUUID().slice(0, 8)}`
  const tenantIds: string[] = []
  let newestId: string
  let olderId: string
  let draftTenantId: string

  async function agency(name: string, status: 'PUBLISHED' | 'DRAFT', publishedAt?: Date) {
    const tenant = await prisma.tenant.create({
      data: { nome: name, slug: `diretorio-agencia-${randomUUID()}` },
    })
    tenantIds.push(tenant.id)
    await prisma.perfilPublicoImobiliaria.create({
      data: {
        tenantId: tenant.id,
        displayName: name,
        cobertura: [`São Conrado ${token}`],
        status,
        publicadoEm: publishedAt ?? null,
      },
    })
    return tenant.id
  }

  function request(query: string) {
    return new NextRequest(`http://localhost/api/marketplace/agencies?${query}`)
  }

  async function ids(query: string) {
    const json = await (await GET(request(query))).json()
    return { ids: json.agencies.map((agency: { id: string }) => agency.id), json }
  }

  beforeAll(async () => {
    olderId = await agency('Imobiliária Antiga', 'PUBLISHED', new Date('2026-01-01T00:00:00Z'))
    newestId = await agency('Imobiliária Nova', 'PUBLISHED', new Date('2026-06-01T00:00:00Z'))
    draftTenantId = await agency('Imobiliária Rascunho', 'DRAFT')
  })

  afterAll(async () => {
    for (const id of tenantIds) await prisma.tenant.delete({ where: { id } })
    await prisma.$disconnect()
  })

  it('lista só imobiliárias publicadas, buscando sem diferenciar acentos nem maiúsculas', async () => {
    const { ids: found, json } = await ids(`q=SAO CONRADO ${token}`)

    expect(found).toEqual([newestId, olderId])
    expect(found).not.toContain(draftTenantId)
    expect(json).toMatchObject({ totalCount: 2, page: 1, pageSize: 12 })
  })

  it('pagina do perfil mais recente para o mais antigo', async () => {
    expect((await ids(`q=${token}&pageSize=1&page=1`)).ids).toEqual([newestId])
    expect((await ids(`q=${token}&pageSize=1&page=2`)).ids).toEqual([olderId])
    expect((await ids(`q=${token}&pageSize=1&page=3`)).ids).toEqual([])
  })

  it('trata % e _ da busca como texto e recusa página grande demais', async () => {
    expect((await ids('q=%25%25%25')).ids).not.toContain(newestId)
    expect((await GET(request('pageSize=51'))).status).toBe(400)
  })
})
