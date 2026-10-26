import { randomUUID } from 'node:crypto'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { prisma } from '@server/db/prisma'

import { PrismaDashboardOverviewRepository } from '../../infrastructure/prisma-dashboard-overview.repository'

describe('PrismaDashboardOverviewRepository.findUpcomingActivities (integração)', () => {
  const repository = new PrismaDashboardOverviewRepository()
  let tenantId: string
  let publishedPropertyId: string

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { nome: 'Tenant Dashboard Imóvel', slug: `dashboard-imovel-${randomUUID()}` },
    })
    tenantId = tenant.id
    const owner = await prisma.usuario.create({
      data: {
        tenantId,
        nome: 'Dona',
        email: `dashboard-imovel-${randomUUID()}@ketris.dev`,
        senhaHash: 'hash-fake',
        papel: 'OWNER',
      },
    })

    const createProperty = (status: 'PUBLISHED' | 'DRAFT', titulo: string) =>
      prisma.imovel.create({
        data: {
          tenantId,
          responsavelId: owner.id,
          titulo,
          finalidade: 'ALUGUEL',
          tipo: 'APARTAMENTO',
          valor: 3200,
          status,
          endereco: {
            create: {
              logradouro: 'Rua das Flores',
              numero: '120',
              bairro: 'Centro',
              cidade: 'Campinas',
              estado: 'SP',
              cep: '13010000',
            },
          },
        },
      })
    const published = await createProperty('PUBLISHED', 'Apartamento publicado')
    const draft = await createProperty('DRAFT', 'Apartamento em rascunho')
    publishedPropertyId = published.id

    const start = new Date(Date.now() + 24 * 60 * 60_000)
    const createEvent = (titulo: string, imovelId: string | null, offsetHours: number) =>
      prisma.eventoAgenda.create({
        data: {
          tenantId,
          titulo,
          tipo: 'VISIT',
          responsavelId: owner.id,
          imovelId,
          inicio: new Date(start.getTime() + offsetHours * 60 * 60_000),
          fim: new Date(start.getTime() + (offsetHours + 1) * 60 * 60_000),
          participanteNome: 'Cliente',
          participanteTelefone: '(11) 98888-0000',
        },
      })
    await createEvent('com-imovel-publicado', published.id, 0)
    await createEvent('com-imovel-rascunho', draft.id, 1)
    await createEvent('sem-imovel', null, 2)
  })

  afterAll(async () => {
    if (tenantId) {
      await prisma.eventoAgenda.deleteMany({ where: { tenantId } })
      await prisma.imovel.deleteMany({ where: { tenantId } })
      await prisma.usuario.deleteMany({ where: { tenantId } })
      await prisma.tenant.delete({ where: { id: tenantId } })
    }
    await prisma.$disconnect()
  })

  it('traz o resumo do imóvel só quando ele está publicado', async () => {
    const activities = await repository.findUpcomingActivities(
      { tenantId, agentId: null },
      new Date(),
      5,
    )
    const byTitle = Object.fromEntries(activities.map((activity) => [activity.title, activity]))

    expect(byTitle['com-imovel-publicado'].property).toEqual({
      id: publishedPropertyId,
      title: 'Apartamento publicado',
      price: 3200,
      address: {
        street: 'Rua das Flores',
        number: '120',
        neighborhood: 'Centro',
        city: 'Campinas',
      },
    })
    expect(byTitle['com-imovel-rascunho'].property).toBeNull()
    expect(byTitle['com-imovel-rascunho'].propertyId).not.toBeNull()
    expect(byTitle['sem-imovel'].property).toBeNull()
  })
})
