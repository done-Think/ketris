// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest'
import { prisma } from '@server/db/prisma'
import {
  PrismaAgendaPropertyCatalog,
  agendaEventPropertyWhere,
  agendaPropertyWhere,
} from '../../infrastructure/prisma-agenda-property-catalog'

vi.mock('@server/db/prisma', () => ({
  prisma: { property: { findMany: vi.fn(), count: vi.fn() }, $transaction: vi.fn() },
}))
beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(prisma.$transaction).mockImplementation(
    async (callback: unknown) => (callback as (tx: unknown) => unknown)(prisma) as never,
  )
})
it('mantém filtros de responsável, proprietário e contrato ativo em todas as projeções', () => {
  const actor = { actorTenantId: 'tenant', actorUserId: 'user' }
  expect(agendaPropertyWhere({ ...actor, actorRole: 'OWNER' })).toEqual({ tenantId: 'tenant' })
  expect(agendaPropertyWhere({ ...actor, actorRole: 'AGENT' })).toEqual({
    tenantId: 'tenant',
    responsibleId: 'user',
  })
  expect(agendaPropertyWhere({ ...actor, actorRole: 'PROPERTY_OWNER' })).toEqual({
    tenantId: 'tenant',
    ownerId: 'user',
  })
  expect(agendaPropertyWhere({ ...actor, actorRole: 'RENTER' })).toEqual({
    contracts: {
      some: { status: 'ACTIVE', parties: { some: { role: 'RENTER', userId: 'user' } } },
    },
  })
})
it('projeta somente o rótulo autorizado e pagina no banco, sem carregar cadastros completos', async () => {
  vi.mocked(prisma.property.findMany).mockResolvedValue([
    { id: 'p1', title: 'Apartamento', address: { neighborhood: 'Centro', city: 'São Paulo' } },
  ] as never)
  vi.mocked(prisma.property.count).mockResolvedValue(26)
  const result = await new PrismaAgendaPropertyCatalog().list({
    actorTenantId: 'tenant',
    actorUserId: 'user',
    actorRole: 'AGENT',
    page: 2,
    pageSize: 25,
    search: 'Centro',
  })
  expect(result).toEqual({
    items: [{ id: 'p1', label: 'Apartamento - Centro, São Paulo' }],
    total: 26,
    page: 2,
    pageSize: 25,
  })
  expect(prisma.property.findMany).toHaveBeenCalledWith(
    expect.objectContaining({
      where: expect.objectContaining({
        tenantId: 'tenant',
        responsibleId: 'user',
        OR: expect.any(Array),
      }),
      skip: 25,
      take: 25,
      select: { id: true, title: true, address: { select: { neighborhood: true, city: true } } },
    }),
  )
})
it('não consulta o banco quando não há imóvel para resumir', async () => {
  expect(
    await new PrismaAgendaPropertyCatalog().summaries(
      { actorTenantId: 'tenant', actorUserId: 'user', actorRole: 'OWNER' },
      [],
    ),
  ).toEqual([])
  expect(prisma.property.findMany).not.toHaveBeenCalled()
})
it('resolve o imóvel dos eventos do corretor em todo o tenant, sem filtrar pelo responsável', () => {
  const actor = { actorTenantId: 'tenant', actorUserId: 'user' }
  expect(agendaEventPropertyWhere({ ...actor, actorRole: 'AGENT' })).toEqual({ tenantId: 'tenant' })
  expect(agendaEventPropertyWhere({ ...actor, actorRole: 'PROPERTY_OWNER' })).toEqual({
    tenantId: 'tenant',
    ownerId: 'user',
  })
})
it('mostra o rótulo do imóvel de outro corretor sem liberar o acesso ao cadastro', async () => {
  vi.mocked(prisma.property.findMany).mockResolvedValue([
    {
      id: 'own',
      title: 'Casa própria',
      address: { neighborhood: 'Centro', city: 'Itajubá' },
      responsibleId: 'user',
    },
    {
      id: 'other',
      title: 'Cobertura',
      address: { neighborhood: 'Sossego', city: 'Piranguinho' },
      responsibleId: 'other-agent',
    },
  ] as never)
  const result = await new PrismaAgendaPropertyCatalog().summaries(
    { actorTenantId: 'tenant', actorUserId: 'user', actorRole: 'AGENT' },
    ['own', 'other'],
  )
  expect(result).toEqual([
    { id: 'own', label: 'Casa própria - Centro, Itajubá', accessible: true },
    { id: 'other', label: 'Cobertura - Sossego, Piranguinho', accessible: false },
  ])
  expect(prisma.property.findMany).toHaveBeenCalledWith(
    expect.objectContaining({ where: { tenantId: 'tenant', id: { in: ['own', 'other'] } } }),
  )
})
it('mantém o acesso ao cadastro para a gestão da imobiliária', async () => {
  vi.mocked(prisma.property.findMany).mockResolvedValue([
    { id: 'p1', title: 'Cobertura', address: null, responsibleId: 'agent' },
  ] as never)
  expect(
    await new PrismaAgendaPropertyCatalog().summaries(
      { actorTenantId: 'tenant', actorUserId: 'manager', actorRole: 'OWNER' },
      ['p1'],
    ),
  ).toEqual([{ id: 'p1', label: 'Cobertura', accessible: true }])
})
