// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest'
import { prisma } from '@server/db/prisma'
import {
  PrismaAgendaPropertyCatalog,
  agendaPropertyWhere,
} from '../../infrastructure/prisma-agenda-property-catalog'

vi.mock('@server/db/prisma', () => ({
  prisma: { imovel: { findMany: vi.fn(), count: vi.fn() }, $transaction: vi.fn() },
}))
beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(prisma.$transaction).mockImplementation(
    async (callback: unknown) => (callback as (tx: unknown) => unknown)(prisma) as never,
  )
})
it('mantém filtros de responsável, proprietário e contrato ativo em todas as projeções', () => {
  const actor = { actorTenantId: 'tenant', actorUserId: 'user' }
  expect(agendaPropertyWhere({ ...actor, actorPapel: 'OWNER' })).toEqual({ tenantId: 'tenant' })
  expect(agendaPropertyWhere({ ...actor, actorPapel: 'AGENT' })).toEqual({
    tenantId: 'tenant',
    responsavelId: 'user',
  })
  expect(agendaPropertyWhere({ ...actor, actorPapel: 'PROPERTY_OWNER' })).toEqual({
    tenantId: 'tenant',
    proprietarioId: 'user',
  })
  expect(agendaPropertyWhere({ ...actor, actorPapel: 'RENTER' })).toEqual({
    contratos: {
      some: { status: 'ATIVO', partes: { some: { papel: 'LOCATARIO', usuarioId: 'user' } } },
    },
  })
})
it('projeta somente o rótulo autorizado e pagina no banco, sem carregar cadastros completos', async () => {
  vi.mocked(prisma.imovel.findMany).mockResolvedValue([
    { id: 'p1', titulo: 'Apartamento', endereco: { bairro: 'Centro', cidade: 'São Paulo' } },
  ] as never)
  vi.mocked(prisma.imovel.count).mockResolvedValue(26)
  const result = await new PrismaAgendaPropertyCatalog().list({
    actorTenantId: 'tenant',
    actorUserId: 'user',
    actorPapel: 'AGENT',
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
  expect(prisma.imovel.findMany).toHaveBeenCalledWith(
    expect.objectContaining({
      where: expect.objectContaining({
        tenantId: 'tenant',
        responsavelId: 'user',
        OR: expect.any(Array),
      }),
      skip: 25,
      take: 25,
      select: { id: true, titulo: true, endereco: { select: { bairro: true, cidade: true } } },
    }),
  )
})
it('não consulta o banco quando não há imóvel para resumir', async () => {
  expect(
    await new PrismaAgendaPropertyCatalog().summaries(
      { actorTenantId: 'tenant', actorUserId: 'user', actorPapel: 'OWNER' },
      [],
    ),
  ).toEqual([])
  expect(prisma.imovel.findMany).not.toHaveBeenCalled()
})
