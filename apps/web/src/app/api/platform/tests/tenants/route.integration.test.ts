import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { prisma } from '@server/db/prisma'
import { JosePlatformTokenService } from '@server/platform/infrastructure/jose-platform-token.service'

import { GET, POST } from '../../tenants/route'

describe('/api/platform/tenants (integração)', () => {
  const tokenService = new JosePlatformTokenService()
  let actorId: string
  let actorToken: string
  let agentId: string
  let agentToken: string
  const marker = randomUUID().slice(0, 8)
  const pagedSlugs = ['a', 'b', 'c'].map((letter) => `paginado-${marker}-${letter}`)
  let createdTenantId: string
  const existingTenantSlug = `existing-${randomUUID()}`
  const createdSlugs: string[] = []

  beforeAll(async () => {
    const actor = await prisma.platformAdmin.create({
      data: {
        name: 'Ator Teste',
        email: `ator-${randomUUID()}@ketris.dev`,
        passwordHash: 'hash-fake',
      },
    })
    actorId = actor.id
    actorToken = await tokenService.sign({
      id: actor.id,
      name: actor.name,
      email: actor.email,
      role: 'ADMIN',
      active: true,
    })

    const agent = await prisma.platformAdmin.create({
      data: {
        name: 'Agente Teste',
        email: `agente-${randomUUID()}@ketris.dev`,
        passwordHash: 'hash-fake',
        role: 'AGENT',
      },
    })
    agentId = agent.id
    agentToken = await tokenService.sign({
      id: agent.id,
      name: agent.name,
      email: agent.email,
      role: 'AGENT',
      active: true,
    })

    await prisma.tenant.create({ data: { name: 'Tenant Existente', slug: existingTenantSlug } })
    for (const [index, slug] of pagedSlugs.entries())
      await prisma.tenant.create({
        data: {
          name: `Paginado ${marker} ${index}`,
          slug,
          accountType: index === 2 ? 'BROKER' : 'AGENCY',
          status: index === 0 ? 'SUSPENDED' : 'ACTIVE',
          createdAt: new Date(Date.UTC(2026, 0, index + 1)),
        },
      })
  })

  afterAll(async () => {
    await prisma.tenant.deleteMany({
      where: { slug: { in: [existingTenantSlug, ...pagedSlugs, ...createdSlugs] } },
    })
    if (createdTenantId)
      await prisma.tenant.delete({ where: { id: createdTenantId } }).catch(() => undefined)
    await prisma.platformAdminRefreshToken.deleteMany({ where: { platformAdminId: actorId } })
    await prisma.platformAdmin.deleteMany({ where: { id: { in: [actorId, agentId] } } })
    await prisma.$disconnect()
  })

  function buildRequest(method: string, body?: unknown, token?: string, search = ''): NextRequest {
    return new NextRequest(`http://localhost/api/platform/tenants${search}`, {
      method,
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    })
  }

  it('GET retorna 200 e encontra o tenant pela busca quando autenticado', async () => {
    const response = await GET(
      buildRequest('GET', undefined, actorToken, `?q=${existingTenantSlug}`),
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.tenants.map((tenant: { slug: string }) => tenant.slug)).toEqual([
      existingTenantSlug,
    ])
  })

  it('GET pagina do mais novo para o mais antigo e devolve os totais por situação', async () => {
    const first = await (
      await GET(buildRequest('GET', undefined, agentToken, `?q=${marker}&pageSize=2`))
    ).json()
    const second = await (
      await GET(buildRequest('GET', undefined, agentToken, `?q=${marker}&pageSize=2&page=2`))
    ).json()

    expect(first.tenants.map((tenant: { slug: string }) => tenant.slug)).toEqual([
      pagedSlugs[2],
      pagedSlugs[1],
    ])
    expect(second.tenants.map((tenant: { slug: string }) => tenant.slug)).toEqual([pagedSlugs[0]])
    expect(first).toMatchObject({
      totalCount: 3,
      page: 1,
      pageSize: 2,
      statusCounts: { ACTIVE: 2, SUSPENDED: 1, TRIAL: 0, CANCELED: 0 },
    })
  })

  it('GET filtra por situação e tipo sem mudar os totais por situação do tipo', async () => {
    const json = await (
      await GET(
        buildRequest('GET', undefined, actorToken, `?q=${marker}&status=ACTIVE&accountType=AGENCY`),
      )
    ).json()

    expect(json.tenants.map((tenant: { slug: string }) => tenant.slug)).toEqual([pagedSlugs[1]])
    expect(json.statusCounts).toMatchObject({ ACTIVE: 1, SUSPENDED: 1 })
  })

  it('GET rejeita parâmetros desconhecidos ou página grande demais', async () => {
    expect((await GET(buildRequest('GET', undefined, actorToken, '?pageSize=500'))).status).toBe(
      400,
    )
    expect((await GET(buildRequest('GET', undefined, actorToken, '?foo=1'))).status).toBe(400)
  })

  it('POST retorna 403 para quem não tem o papel ADMIN', async () => {
    const slug = `proibido-${randomUUID()}`
    const response = await POST(buildRequest('POST', { name: 'Proibido', slug }, agentToken))

    expect(response.status).toBe(403)
    expect(await prisma.tenant.count({ where: { slug } })).toBe(0)
  })

  it('GET retorna 401 sem Authorization header', async () => {
    const response = await GET(buildRequest('GET'))

    expect(response.status).toBe(401)
  })

  it('POST cria um novo tenant quando autenticado', async () => {
    const slug = `novo-${randomUUID()}`

    const response = await POST(buildRequest('POST', { name: 'Novo Tenant', slug }, actorToken))
    const json = await response.json()

    expect(response.status).toBe(201)
    expect(json.tenant.slug).toBe(slug)
    createdTenantId = json.tenant.id
  })

  it('POST cria como imobiliária ativa por padrão e aceita tipo e situação inicial', async () => {
    const defaultSlug = `padrao-${randomUUID()}`
    const brokerSlug = `corretor-${randomUUID()}`
    createdSlugs.push(defaultSlug, brokerSlug)

    expect(
      (await POST(buildRequest('POST', { name: 'Padrão', slug: defaultSlug }, actorToken))).status,
    ).toBe(201)
    expect(
      (
        await POST(
          buildRequest(
            'POST',
            { name: 'Corretor', slug: brokerSlug, accountType: 'BROKER', status: 'TRIAL' },
            actorToken,
          ),
        )
      ).status,
    ).toBe(201)

    const created = await prisma.tenant.findMany({
      where: { slug: { in: [defaultSlug, brokerSlug] } },
      select: { slug: true, accountType: true, status: true },
    })
    expect(created).toEqual(
      expect.arrayContaining([
        { slug: defaultSlug, accountType: 'AGENCY', status: 'ACTIVE' },
        { slug: brokerSlug, accountType: 'BROKER', status: 'TRIAL' },
      ]),
    )
  })

  it.each([[{ accountType: 'GOLD' }], [{ status: 'CANCELED' }]])(
    'POST retorna 400 para tipo ou situação inicial inválidos: %j',
    async (extra) => {
      const response = await POST(
        buildRequest(
          'POST',
          { name: 'Inválido', slug: `invalido-${randomUUID()}`, ...extra },
          actorToken,
        ),
      )

      expect(response.status).toBe(400)
    },
  )

  it('POST retorna 409 quando o slug já existe', async () => {
    const response = await POST(
      buildRequest('POST', { name: 'Duplicado', slug: existingTenantSlug }, actorToken),
    )
    const json = await response.json()

    expect(response.status).toBe(409)
    expect(json.error.code).toBe('TENANT_SLUG_ALREADY_IN_USE')
  })

  it('POST retorna 401 sem Authorization header', async () => {
    const response = await POST(buildRequest('POST', { name: 'X', slug: `x-${randomUUID()}` }))

    expect(response.status).toBe(401)
  })
})
