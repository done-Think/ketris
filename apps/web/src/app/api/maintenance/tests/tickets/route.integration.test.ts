import type {
  MaintenanceTicketListItem,
  MaintenanceTicketStatus,
} from '@server/maintenance/types/maintenance-ticket'
import { randomUUID } from 'node:crypto'
import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { prisma } from '@server/db/prisma'
import type { Papel } from '@server/auth/domain/user.entity'
import { GET, POST } from '../../tickets/route'
import { DELETE, GET as getTicket, PATCH } from '../../tickets/[id]/route'
import { POST as act } from '../../tickets/[id]/actions/route'
import { POST as addNote } from '../../tickets/[id]/notes/route'
import { GET as listActivities } from '../../tickets/[id]/activities/route'
import { POST as links } from '../../links/route'
import { GET as options } from '../../options/route'

describe('/api/maintenance authorization and workflow (database integration)', () => {
  const tokenService = new JoseTokenService()
  const tenantIds: string[] = []
  let fixture: Awaited<ReturnType<typeof createFixture>>
  let other: Awaited<ReturnType<typeof createFixture>>
  async function createFixture() {
    const tenant = await prisma.tenant.create({
      data: { nome: 'Maintenance Test', slug: `maintenance-${randomUUID()}` },
    })
    tenantIds.push(tenant.id)
    async function user(role: Papel) {
      const user = await prisma.usuario.create({
        data: {
          tenantId: tenant.id,
          nome: role,
          email: `${randomUUID()}@maintenance.test`,
          senhaHash: 'test-hash',
          papel: role,
        },
      })
      return { ...user, token: await tokenService.sign(user) }
    }
    const admin = await user('ADMIN'),
      agent = await user('AGENT'),
      owner = await user('OWNER'),
      renter = await user('RENTER'),
      unrelated = await user('RENTER'),
      unrelatedOwner = await user('OWNER'),
      unrelatedAgent = await user('AGENT')
    const property = await prisma.imovel.create({
      data: {
        tenantId: tenant.id,
        responsavelId: agent.id,
        proprietarioId: owner.id,
        titulo: 'Test Property',
        finalidade: 'ALUGUEL',
        tipo: 'apartamento',
        valor: 2500,
      },
    })
    const opportunity = await prisma.oportunidade.create({
      data: {
        tenantId: tenant.id,
        imovelId: property.id,
        interessadoNome: renter.nome,
        interessadoEmail: renter.email,
        valorProposto: 2500,
        status: 'ACEITA',
      },
    })
    const contract = await prisma.contrato.create({
      data: {
        tenantId: tenant.id,
        imovelId: property.id,
        oportunidadeOrigemId: opportunity.id,
        codigo: `TEST-${randomUUID()}`,
        valor: 2500,
        diaVencimento: 5,
        dataInicio: new Date('2026-01-01'),
        dataFim: new Date('2027-01-01'),
        indiceReajuste: 'IPCA',
        tipoGarantia: 'CAUCAO',
        status: 'ATIVO',
        partes: {
          create: {
            papel: 'LOCATARIO',
            nome: renter.nome,
            cpf: '00000000000',
            email: renter.email,
            usuarioId: renter.id,
          },
        },
      },
      include: { partes: true },
    })
    return {
      tenant,
      admin,
      agent,
      owner,
      renter,
      unrelated,
      unrelatedOwner,
      unrelatedAgent,
      property,
      contract,
    }
  }
  beforeAll(async () => {
    fixture = await createFixture()
    other = await createFixture()
  })
  afterAll(async () => {
    for (const tenantId of tenantIds) {
      await prisma.solicitacaoTrocaPrestador.deleteMany({ where: { chamado: { tenantId } } })
      await prisma.tenant.delete({ where: { id: tenantId } })
    }
    await prisma.$disconnect()
  })
  function request(path: string, method: string, token?: string, body?: unknown) {
    return new NextRequest(`http://localhost/api/maintenance/${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
  }
  const context = (id: string) => ({ params: Promise.resolve({ id }) })
  const payload = {
    title: 'Leak',
    description: 'Kitchen leak',
    category: 'Plumbing',
    priority: 'NORMAL',
  }
  async function create(token = fixture.renter.token) {
    const response = await POST(
      request('tickets', 'POST', token, { ...payload, contractId: fixture.contract.id }),
    )
    expect(response.status).toBe(201)
    return (await response.json()).ticket.id as string
  }
  async function action(id: string, token: string, body: unknown) {
    return act(request(`tickets/${id}/actions`, 'POST', token, body), context(id))
  }
  async function legacyTicket(status: MaintenanceTicketStatus = 'FECHADO', archived = false) {
    return prisma.chamadoManutencao.create({
      data: {
        tenantId: fixture.tenant.id,
        imovelId: fixture.property.id,
        categoria: 'Plumbing',
        titulo: 'Legacy ticket',
        descricao: 'Existing record',
        abertoPorId: fixture.admin.id,
        abertoPorNome: fixture.admin.nome,
        status,
        resolvidoEm: ['RESOLVIDO', 'FECHADO'].includes(status) ? new Date('2026-09-01') : null,
        excluidoEm: archived ? new Date('2026-09-02') : null,
        excluidoPorId: archived ? fixture.admin.id : null,
        concluidoPorId: fixture.agent.id,
        concluidoPorPapel: 'AGENT',
        atividades: { create: { tipo: 'NOTA', mensagem: 'Historical note' } },
        anexos: { create: { nome: 'Historical photo', url: '/existing-photo.png' } },
      },
      include: { atividades: true, anexos: true },
    })
  }
  async function anotherContract(propertyId = fixture.property.id) {
    const renter = await prisma.usuario.create({
      data: {
        tenantId: fixture.tenant.id,
        nome: 'Alternate contract renter',
        email: `${randomUUID()}@maintenance.test`,
        senhaHash: 'test-hash',
        papel: 'RENTER',
      },
    })
    const opportunity = await prisma.oportunidade.create({
      data: {
        tenantId: fixture.tenant.id,
        imovelId: propertyId,
        interessadoNome: renter.nome,
        interessadoEmail: renter.email,
        valorProposto: 2500,
        status: 'ACEITA',
      },
    })
    const contract = await prisma.contrato.create({
      data: {
        tenantId: fixture.tenant.id,
        imovelId: propertyId,
        oportunidadeOrigemId: opportunity.id,
        codigo: `TEST-${randomUUID()}`,
        valor: 2500,
        diaVencimento: 5,
        dataInicio: new Date('2027-01-01'),
        dataFim: new Date('2028-01-01'),
        indiceReajuste: 'IPCA',
        tipoGarantia: 'CAUCAO',
        partes: {
          create: {
            papel: 'LOCATARIO',
            nome: renter.nome,
            cpf: '00000000000',
            email: renter.email,
            usuarioId: renter.id,
          },
        },
      },
    })
    return { ...contract, renterToken: await tokenService.sign(renter) }
  }
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
      const authorized = [fixture.owner, fixture.agent, fixture.renter]
      const outsiders = [
        fixture.unrelated,
        fixture.unrelatedOwner,
        fixture.unrelatedAgent,
        other.admin,
      ]
      for (const user of [...authorized, ...outsiders]) {
        expect(
          (await getTicket(request(`tickets/${before.id}`, 'GET', user.token), context(before.id)))
            .status,
        ).toBe(404)
      }
      const response = await action(before.id, fixture.admin.token, {
        action: 'linkContract',
        contractId: fixture.contract.id,
      })
      expect(response.status).toBe(200)
      const after = await prisma.chamadoManutencao.findUniqueOrThrow({
        where: { id: before.id },
        include: { atividades: true, anexos: true },
      })
      expect(after).toEqual({
        ...before,
        contratoId: fixture.contract.id,
        updatedAt: expect.any(Date),
        atividades: expect.arrayContaining(before.atividades),
      })
      expect(after.updatedAt.getTime()).toBeGreaterThan(before.updatedAt.getTime())
      expect(after.atividades).toHaveLength(before.atividades.length + 1)
      expect(after.atividades.find((a) => a.tipo === 'EDICAO')).toMatchObject({
        autorId: fixture.admin.id,
        autorNome: fixture.admin.nome,
        detalhes: {
          before: { contractId: null, propertyId: fixture.property.id },
          after: { contractId: fixture.contract.id, propertyId: fixture.property.id },
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
        expect((await action(before.id, fixture.admin.token, { action: 'restore' })).status).toBe(
          200,
        )
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
        tenantId: fixture.tenant.id,
        responsavelId: fixture.agent.id,
        titulo: 'Another property',
        finalidade: 'ALUGUEL',
        tipo: 'apartamento',
        valor: 2500,
      },
    })
    const wrongProperty = await anotherContract(property.id)
    for (const contractId of ['missing', other.contract.id, wrongProperty.id]) {
      expect(
        (await action(before.id, fixture.admin.token, { action: 'linkContract', contractId }))
          .status,
      ).toBe(404)
    }
    for (const user of [fixture.owner, fixture.agent, fixture.renter, other.admin]) {
      expect(
        (
          await action(before.id, user.token, {
            action: 'linkContract',
            contractId: fixture.contract.id,
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
    expect((await action(before.id, fixture.admin.token, { action: 'linkContract' })).status).toBe(
      400,
    )
    expect(
      (await action(before.id, fixture.admin.token, { action: 'linkContract', contractId: ' ' }))
        .status,
    ).toBe(400)
    expect(
      (await prisma.chamadoManutencao.findUniqueOrThrow({ where: { id: before.id } })).contratoId,
    ).toBeNull()
    // User membership regularization does not infer a contract for existing calls.
    expect(
      (
        await links(
          request('links', 'POST', fixture.admin.token, {
            contractId: selected.id,
            ownerId: fixture.owner.id,
          }),
        )
      ).status,
    ).toBe(204)
    expect(
      (await prisma.chamadoManutencao.findUniqueOrThrow({ where: { id: before.id } })).contratoId,
    ).toBeNull()
    expect(
      (
        await action(before.id, fixture.admin.token, {
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
          request(`tickets/${before.id}`, 'GET', fixture.renter.token),
          context(before.id),
        )
      ).status,
    ).toBe(404)
    // Also audit explicit correction of an existing association, without reopening the call.
    expect(
      (
        await action(before.id, fixture.admin.token, {
          action: 'linkContract',
          contractId: fixture.contract.id,
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
          request(`tickets/${before.id}`, 'GET', fixture.renter.token),
          context(before.id),
        )
      ).status,
    ).toBe(200)
  })
  it('requires authentication', async () =>
    expect((await GET(request('tickets', 'GET'))).status).toBe(401))
  it('creates for all linked roles and refuses another tenants contract', async () => {
    for (const user of [fixture.admin, fixture.agent, fixture.owner, fixture.renter])
      await create(user.token)
    expect(
      (
        await POST(
          request('tickets', 'POST', fixture.renter.token, {
            ...payload,
            contractId: other.contract.id,
          }),
        )
      ).status,
    ).toBe(404)
    expect(
      (
        await POST(
          request('tickets', 'POST', fixture.unrelated.token, {
            ...payload,
            contractId: fixture.contract.id,
          }),
        )
      ).status,
    ).toBe(404)
  })
  it('filters list and options by explicit membership, including same-tenant isolation', async () => {
    const id = await create()
    const allowed = await GET(request('tickets', 'GET', fixture.renter.token))
    expect(
      (await allowed.json()).items.map((item: Pick<MaintenanceTicketListItem, 'id'>) => item.id),
    ).toContain(id)
    const denied = await GET(request('tickets', 'GET', fixture.unrelated.token))
    expect(await denied.json()).toEqual({ items: [], totalCount: 0 })
    expect(
      (await (await options(request('options', 'GET', fixture.unrelated.token))).json()).contracts,
    ).toEqual([])
    for (const user of [fixture.unrelated, other.admin]) {
      expect(
        (await getTicket(request(`tickets/${id}`, 'GET', user.token), context(id))).status,
      ).toBe(404)
      expect(
        (
          await PATCH(
            request(`tickets/${id}`, 'PATCH', user.token, { title: 'Changed' }),
            context(id),
          )
        ).status,
      ).toBe(404)
      expect(
        (await listActivities(request(`tickets/${id}/activities`, 'GET', user.token), context(id)))
          .status,
      ).toBe(404)
      expect(
        (
          await addNote(
            request(`tickets/${id}/notes`, 'POST', user.token, { message: 'Denied' }),
            context(id),
          )
        ).status,
      ).toBe(404)
      expect(
        (await DELETE(request(`tickets/${id}`, 'DELETE', user.token), context(id))).status,
      ).toBe(404)
    }
  })
  it('allows renter collaboration on admin calls, but only edits own OPEN calls', async () => {
    const id = await create(fixture.admin.token)
    expect(
      (
        await addNote(
          request(`tickets/${id}/notes`, 'POST', fixture.renter.token, { message: 'Comment' }),
          context(id),
        )
      ).status,
    ).toBe(201)
    expect(
      (
        await PATCH(
          request(`tickets/${id}`, 'PATCH', fixture.renter.token, { title: 'Denied' }),
          context(id),
        )
      ).status,
    ).toBe(403)
    const own = await create()
    expect(
      (
        await PATCH(
          request(`tickets/${own}`, 'PATCH', fixture.renter.token, { title: 'Allowed' }),
          context(own),
        )
      ).status,
    ).toBe(200)
    expect((await action(own, fixture.renter.token, { action: 'cancel' })).status).toBe(403)
    expect((await action(own, fixture.renter.token, { action: 'complete' })).status).toBe(403)
  })
  it('requires assigned agent, contests and confirms resolution, then locks writes', async () => {
    const id = await create()
    expect((await action(id, fixture.agent.token, { action: 'start' })).status).toBe(403)
    expect((await action(id, fixture.agent.token, { action: 'assume' })).status).toBe(200)
    expect((await action(id, fixture.owner.token, { action: 'assume' })).status).toBe(403)
    expect((await action(id, fixture.agent.token, { action: 'start' })).status).toBe(200)
    expect((await action(id, fixture.agent.token, { action: 'complete' })).status).toBe(200)
    expect(
      (await action(id, fixture.owner.token, { action: 'contest', reason: 'Still leaking' }))
        .status,
    ).toBe(200)
    expect((await action(id, fixture.agent.token, { action: 'start' })).status).toBe(200)
    expect((await action(id, fixture.agent.token, { action: 'complete' })).status).toBe(200)
    const resolved = await action(id, fixture.owner.token, { action: 'confirm' })
    expect(resolved.status).toBe(200)
    expect((await resolved.json()).ticket.status).toBe('RESOLVIDO')
    expect(
      (
        await addNote(
          request(`tickets/${id}/notes`, 'POST', fixture.admin.token, { message: 'Denied' }),
          context(id),
        )
      ).status,
    ).toBe(409)
    expect(
      (await action(id, fixture.admin.token, { action: 'reopen', status: 'EM_ANDAMENTO' })).status,
    ).toBe(200)
  })
  it('prevents owner self-confirmation and requires admin validation', async () => {
    const id = await create()
    await action(id, fixture.owner.token, { action: 'assume' })
    await action(id, fixture.owner.token, { action: 'start' })
    await action(id, fixture.owner.token, { action: 'complete' })
    expect((await action(id, fixture.owner.token, { action: 'confirm' })).status).toBe(403)
    expect((await action(id, fixture.admin.token, { action: 'confirm' })).status).toBe(200)
  })
  it('records provider replacement requests and approval snapshots', async () => {
    const id = await create()
    await action(id, fixture.admin.token, { action: 'provider', provider: { name: 'Old vendor' } })
    expect(
      (await action(id, fixture.owner.token, { action: 'provider', provider: { name: 'Denied' } }))
        .status,
    ).toBe(403)
    const response = await action(id, fixture.owner.token, {
      action: 'requestReplacement',
      reason: 'Unreliable',
    })
    const pending = (await response.json()).ticket.replacementRequests[0]
    expect(
      (
        await action(id, fixture.admin.token, {
          action: 'rejectReplacement',
          requestId: pending.id,
          reason: ' ',
        })
      ).status,
    ).toBe(400)
    expect(
      (
        await action(id, fixture.admin.token, {
          action: 'approveReplacement',
          requestId: pending.id,
          provider: { name: 'New vendor' },
        })
      ).status,
    ).toBe(200)
    const row = await prisma.chamadoManutencao.findUniqueOrThrow({
      where: { id },
      include: { atividades: true, solicitacoesTroca: true },
    })
    expect(row.prestadorNome).toBe('New vendor')
    expect(row.solicitacoesTroca[0].status).toBe('APROVADA')
    expect(row.atividades.find((a) => a.tipo === 'TROCA_DECIDIDA')?.detalhes).toMatchObject({
      before: { name: 'Old vendor' },
      after: { name: 'New vendor' },
    })
  })
  it('preserves excluded records and permits only admin to list/restore them', async () => {
    const id = await create()
    expect(
      (await DELETE(request(`tickets/${id}`, 'DELETE', fixture.renter.token), context(id))).status,
    ).toBe(403)
    expect(
      (await DELETE(request(`tickets/${id}`, 'DELETE', fixture.admin.token), context(id))).status,
    ).toBe(204)
    expect(
      (await prisma.chamadoManutencao.findUniqueOrThrow({ where: { id } })).excluidoEm,
    ).not.toBeNull()
    expect(
      (await getTicket(request(`tickets/${id}`, 'GET', fixture.renter.token), context(id))).status,
    ).toBe(404)
    expect((await GET(request('tickets?archived=true', 'GET', fixture.renter.token))).status).toBe(
      403,
    )
    const archived = await GET(request('tickets?archived=true', 'GET', fixture.admin.token))
    expect(
      (await archived.json()).items.map((item: Pick<MaintenanceTicketListItem, 'id'>) => item.id),
    ).toContain(id)
    expect((await action(id, fixture.admin.token, { action: 'restore' })).status).toBe(200)
    const row = await prisma.chamadoManutencao.findUniqueOrThrow({
      where: { id },
      include: { atividades: true },
    })
    expect(row.excluidoEm).toBeNull()
    expect(row.status).toBe('ABERTO')
    expect(row.atividades.map((a) => a.tipo)).toEqual(
      expect.arrayContaining(['EXCLUSAO', 'RESTAURACAO']),
    )
  })
  it('allows only admin to regularize and never links foreign tenant users', async () => {
    const input = {
      contractId: fixture.contract.id,
      partyId: fixture.contract.partes[0].id,
      renterId: fixture.renter.id,
    }
    expect((await links(request('links', 'POST', fixture.owner.token, input))).status).toBe(403)
    expect(
      (
        await links(
          request('links', 'POST', fixture.admin.token, { ...input, renterId: other.renter.id }),
        )
      ).status,
    ).toBe(403)
    expect((await links(request('links', 'POST', fixture.admin.token, input))).status).toBe(204)
  })
})
