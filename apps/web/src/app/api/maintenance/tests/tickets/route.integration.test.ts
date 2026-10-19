import type { MaintenanceTicketListItem } from '@server/maintenance/types/maintenance-ticket'
import { randomUUID } from 'node:crypto'
import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import type { UploadMaintenanceAttachmentInput } from '@server/maintenance/types/maintenance-attachment-storage'
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
import { POST as attachFile } from '../../tickets/[id]/attachments/route'

const { uploadToStorage } = vi.hoisted(() => ({ uploadToStorage: vi.fn() }))
vi.mock('@server/maintenance/infrastructure/s3-maintenance-attachment-storage', () => ({
  S3MaintenanceAttachmentStorage: class {
    upload = uploadToStorage
  },
}))

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
      unrelated = await user('RENTER')
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
    return { tenant, admin, agent, owner, renter, unrelated, property, contract }
  }
  beforeAll(async () => {
    uploadToStorage.mockImplementation(async (input: UploadMaintenanceAttachmentInput) => ({
      url: `/api/maintenance/media/maintenance/${input.tenantId}/${randomUUID()}.png`,
      contentType: input.contentType,
    }))
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

  function attachmentRequest(id: string, token: string) {
    const formData = new FormData()
    formData.set('file', new File(['test image'], 'repair.png', { type: 'image/png' }))
    return new NextRequest(`http://localhost/api/maintenance/tickets/${id}/attachments`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
      body: formData,
    })
  }

  it.each(['RESOLVIDO', 'CANCELADO', 'FECHADO'] as const)(
    'preserves linked renter reading of %s tickets with timeline and attachments',
    async (status) => {
      const id = await create()
      const note = await addNote(
        request(`tickets/${id}/notes`, 'POST', fixture.renter.token, {
          message: 'Repair photo attached.',
        }),
        context(id),
      )
      expect(note.status).toBe(201)
      const attachment = await attachFile(attachmentRequest(id, fixture.renter.token), context(id))
      expect(attachment.status).toBe(201)
      const attachmentBody = await attachment.json()
      await prisma.chamadoManutencao.update({ where: { id }, data: { status } })
      const detail = await getTicket(
        request(`tickets/${id}`, 'GET', fixture.renter.token),
        context(id),
      )
      expect(detail.status).toBe(200)
      const body = await detail.json()
      expect(body.ticket.status).toBe(status)
      expect(body.ticket.activities).toEqual(
        expect.arrayContaining([expect.objectContaining({ message: 'Repair photo attached.' })]),
      )
      expect(body.ticket.attachments).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: attachmentBody.attachment.id })]),
      )
      expect(Object.values(body.ticket.permissions).every((allowed) => allowed === false)).toBe(
        true,
      )
      const list = await GET(request(`tickets?status=${status}`, 'GET', fixture.renter.token))
      expect((await list.json()).items).toEqual(
        expect.arrayContaining([expect.objectContaining({ id })]),
      )
      expect(
        (
          await listActivities(
            request(`tickets/${id}/activities`, 'GET', fixture.renter.token),
            context(id),
          )
        ).status,
      ).toBe(200)
      const uploadCount = uploadToStorage.mock.calls.length
      expect(
        (await attachFile(attachmentRequest(id, fixture.renter.token), context(id))).status,
      ).toBe(409)
      expect(uploadToStorage).toHaveBeenCalledTimes(uploadCount)
      expect(
        (
          await PATCH(
            request(`tickets/${id}`, 'PATCH', fixture.renter.token, { title: 'Denied' }),
            context(id),
          )
        ).status,
      ).toBe(409)
      expect(
        (
          await addNote(
            request(`tickets/${id}/notes`, 'POST', fixture.renter.token, { message: 'Denied' }),
            context(id),
          )
        ).status,
      ).toBe(409)
      for (const user of [fixture.unrelated, other.renter]) {
        expect(
          (await getTicket(request(`tickets/${id}`, 'GET', user.token), context(id))).status,
        ).toBe(404)
        expect((await attachFile(attachmentRequest(id, user.token), context(id))).status).toBe(404)
      }
      expect(uploadToStorage).toHaveBeenCalledTimes(uploadCount)
    },
  )

  it('does not grant renters management, confirmation or contestation permissions', async () => {
    const id = await create()
    const actions = [
      { action: 'assume' },
      { action: 'assign', responsibleId: fixture.agent.id },
      { action: 'provider', provider: { name: 'Denied' } },
      { action: 'requestReplacement', reason: 'Denied' },
      { action: 'start' },
      { action: 'complete' },
      { action: 'cancel' },
    ]
    for (const input of actions)
      expect((await action(id, fixture.renter.token, input)).status).toBe(403)
    await prisma.chamadoManutencao.update({
      where: { id },
      data: { status: 'AGUARDANDO_CONFIRMACAO' },
    })
    expect((await action(id, fixture.renter.token, { action: 'confirm' })).status).toBe(403)
    expect(
      (await action(id, fixture.renter.token, { action: 'contest', reason: 'Denied' })).status,
    ).toBe(403)
    expect(
      (await DELETE(request(`tickets/${id}`, 'DELETE', fixture.renter.token), context(id))).status,
    ).toBe(403)
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
