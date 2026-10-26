import { prisma } from '@server/db/prisma'
import type { MaintenanceTicketListItem } from '@server/maintenance/types/maintenance-ticket'
import { describe, expect, it } from 'vitest'
import { POST as links } from '../../links/route'
import { GET as listActivities } from '../../tickets/[id]/activities/route'
import { GET as getTicket } from '../../tickets/[id]/route'
import { GET } from '../../tickets/route'
import { setupMaintenanceIntegration } from '../fixtures/maintenance-api'

describe('/api/maintenance regularization (database integration)', () => {
  const env = setupMaintenanceIntegration()
  const { request, context, action, legacyTicket, anotherContract } = env
  it.each([
    { status: 'ABERTO', archived: false },
    { status: 'EM_ANDAMENTO', archived: false },
    { status: 'RESOLVIDO', archived: false },
    { status: 'CANCELADO', archived: false },
    { status: 'FECHADO', archived: false },
    { status: 'FECHADO', archived: true },
    { status: 'RESOLVIDO', archived: true },
  ] as const)(
    'regularizes legacy $status (archived=$archived) preserving lifecycle and restoring scoped access',
    async ({ status, archived }) => {
      const before = await legacyTicket(status, archived)
      const authorized = [env.fixture.owner, env.fixture.agent, env.fixture.renter]
      const outsiders = [
        env.fixture.unrelated,
        env.fixture.unrelatedOwner,
        env.fixture.unrelatedAgent,
        env.other.admin,
      ]
      for (const user of [...authorized, ...outsiders]) {
        expect(
          (await getTicket(request(`tickets/${before.id}`, 'GET', user.token), context(before.id)))
            .status,
        ).toBe(404)
      }
      const response = await action(before.id, env.fixture.admin.token, {
        action: 'linkContract',
        contractId: env.fixture.contract.id,
      })
      expect(response.status).toBe(200)
      const after = await prisma.chamadoManutencao.findUniqueOrThrow({
        where: { id: before.id },
        include: { atividades: true, anexos: true },
      })
      expect(after).toEqual({
        ...before,
        contratoId: env.fixture.contract.id,
        updatedAt: expect.any(Date),
        atividades: expect.arrayContaining(before.atividades),
      })
      expect(after.updatedAt.getTime()).toBeGreaterThan(before.updatedAt.getTime())
      expect(after.atividades).toHaveLength(before.atividades.length + 1)
      expect(after.atividades.find((a) => a.tipo === 'EDICAO')).toMatchObject({
        autorId: env.fixture.admin.id,
        autorNome: env.fixture.admin.nome,
        detalhes: {
          before: { contractId: null, propertyId: env.fixture.property.id },
          after: { contractId: env.fixture.contract.id, propertyId: env.fixture.property.id },
        },
      })
      if (archived) {
        for (const user of authorized) {
          expect(
            (
              await getTicket(
                request(`tickets/${before.id}`, 'GET', user.token),
                context(before.id),
              )
            ).status,
          ).toBe(404)
        }
        expect(
          (await action(before.id, env.fixture.admin.token, { action: 'restore' })).status,
        ).toBe(200)
        const restored = await prisma.chamadoManutencao.findUniqueOrThrow({
          where: { id: before.id },
        })
        expect(restored.status).toBe(status)
        expect(restored.resolvidoEm).toEqual(before.resolvidoEm)
      }
      for (const user of authorized) {
        expect(
          (await getTicket(request(`tickets/${before.id}`, 'GET', user.token), context(before.id)))
            .status,
        ).toBe(200)
        expect(
          (
            await listActivities(
              request(`tickets/${before.id}/activities`, 'GET', user.token),
              context(before.id),
            )
          ).status,
        ).toBe(200)
        const list = await GET(request('tickets', 'GET', user.token))
        expect(
          (await list.json()).items.map((item: MaintenanceTicketListItem) => item.id),
        ).toContain(before.id)
      }
      for (const user of outsiders) {
        expect(
          (await getTicket(request(`tickets/${before.id}`, 'GET', user.token), context(before.id)))
            .status,
        ).toBe(404)
        expect(
          (
            await listActivities(
              request(`tickets/${before.id}/activities`, 'GET', user.token),
              context(before.id),
            )
          ).status,
        ).toBe(404)
        const list = await GET(request('tickets', 'GET', user.token))
        expect(
          (await list.json()).items.map((item: MaintenanceTicketListItem) => item.id),
        ).not.toContain(before.id)
      }
    },
  )

  it('regularization rejects unauthorized actors, missing/foreign contracts and another property without audit or mutation', async () => {
    const before = await legacyTicket()
    const property = await prisma.imovel.create({
      data: {
        tenantId: env.fixture.tenant.id,
        responsavelId: env.fixture.agent.id,
        titulo: 'Another property',
        finalidade: 'ALUGUEL',
        tipo: 'APARTAMENTO',
        valor: 2500,
      },
    })
    const wrongProperty = await anotherContract(property.id)
    for (const contractId of ['missing', env.other.contract.id, wrongProperty.id]) {
      expect(
        (await action(before.id, env.fixture.admin.token, { action: 'linkContract', contractId }))
          .status,
      ).toBe(404)
    }
    for (const user of [
      env.fixture.owner,
      env.fixture.agent,
      env.fixture.renter,
      env.other.admin,
    ]) {
      expect(
        (
          await action(before.id, user.token, {
            action: 'linkContract',
            contractId: env.fixture.contract.id,
          })
        ).status,
      ).toBe(404)
    }
    const after = await prisma.chamadoManutencao.findUniqueOrThrow({
      where: { id: before.id },
      include: { atividades: true, anexos: true },
    })
    expect(after).toEqual(before)
  })

  it('regularization requires an explicit choice among contracts and grants access only to the selected contract renter', async () => {
    const before = await legacyTicket()
    const selected = await anotherContract()
    expect(
      (await action(before.id, env.fixture.admin.token, { action: 'linkContract' })).status,
    ).toBe(400)
    expect(
      (
        await action(before.id, env.fixture.admin.token, {
          action: 'linkContract',
          contractId: ' ',
        })
      ).status,
    ).toBe(400)
    expect(
      (await prisma.chamadoManutencao.findUniqueOrThrow({ where: { id: before.id } })).contratoId,
    ).toBeNull()
    // User membership regularization does not infer a contract for existing calls.
    expect(
      (
        await links(
          request('links', 'POST', env.fixture.admin.token, {
            contractId: selected.id,
            ownerId: env.fixture.owner.id,
          }),
        )
      ).status,
    ).toBe(204)
    expect(
      (await prisma.chamadoManutencao.findUniqueOrThrow({ where: { id: before.id } })).contratoId,
    ).toBeNull()
    expect(
      (
        await action(before.id, env.fixture.admin.token, {
          action: 'linkContract',
          contractId: selected.id,
        })
      ).status,
    ).toBe(200)
    expect(
      (
        await getTicket(
          request(`tickets/${before.id}`, 'GET', selected.renterToken),
          context(before.id),
        )
      ).status,
    ).toBe(200)
    expect(
      (
        await getTicket(
          request(`tickets/${before.id}`, 'GET', env.fixture.renter.token),
          context(before.id),
        )
      ).status,
    ).toBe(404)
    // Also audit explicit correction of an existing association, without reopening the call.
    expect(
      (
        await action(before.id, env.fixture.admin.token, {
          action: 'linkContract',
          contractId: env.fixture.contract.id,
        })
      ).status,
    ).toBe(200)
    const corrected = await prisma.chamadoManutencao.findUniqueOrThrow({
      where: { id: before.id },
      include: { atividades: true },
    })
    expect(corrected.status).toBe(before.status)
    expect(corrected.resolvidoEm).toEqual(before.resolvidoEm)
    expect(
      corrected.atividades.some(
        (a) => a.detalhes && JSON.stringify(a.detalhes).includes(selected.id),
      ),
    ).toBe(true)
    expect(
      (
        await getTicket(
          request(`tickets/${before.id}`, 'GET', selected.renterToken),
          context(before.id),
        )
      ).status,
    ).toBe(404)
    expect(
      (
        await getTicket(
          request(`tickets/${before.id}`, 'GET', env.fixture.renter.token),
          context(before.id),
        )
      ).status,
    ).toBe(200)
  })

  it('allows only admin to regularize and rejects accounts with a different party email', async () => {
    const input = {
      contractId: env.fixture.contract.id,
      partyId: env.fixture.contract.partes[0].id,
      renterId: env.fixture.renter.id,
    }
    expect((await links(request('links', 'POST', env.fixture.owner.token, input))).status).toBe(403)
    expect(
      (
        await links(
          request('links', 'POST', env.fixture.admin.token, {
            ...input,
            renterId: env.other.renter.id,
          }),
        )
      ).status,
    ).toBe(409)
    expect((await links(request('links', 'POST', env.fixture.admin.token, input))).status).toBe(204)
  })
})
