import type {
  MaintenanceTicketListItem,
  MaintenanceTicketStatus,
} from '@server/maintenance/types/maintenance-ticket'
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
      expect(body.ticket.permissions).toMatchObject({
        edit: false,
        collaborate: false,
        comment: status === 'RESOLVIDO',
        reopen: status === 'RESOLVIDO',
        confirm: false,
      })
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
            request(`tickets/${id}/notes`, 'POST', fixture.renter.token, {
              message: 'Additional detail',
            }),
            context(id),
          )
        ).status,
      ).toBe(status === 'RESOLVIDO' ? 201 : 409)
      for (const user of [fixture.unrelated, other.renter]) {
        expect(
          (await getTicket(request(`tickets/${id}`, 'GET', user.token), context(id))).status,
        ).toBe(404)
        expect((await attachFile(attachmentRequest(id, user.token), context(id))).status).toBe(404)
      }
      expect(uploadToStorage).toHaveBeenCalledTimes(uploadCount)
    },
  )

  it('does not grant renters internal management or confirmation permissions', async () => {
    const id = await create()
    const actions = [
      { action: 'assume' },
      { action: 'assign', responsibleId: fixture.agent.id },
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
      (await action(id, fixture.renter.token, { action: 'contest', reason: 'Still leaking' }))
        .status,
    ).toBe(200)
    expect(
      (await DELETE(request(`tickets/${id}`, 'DELETE', fixture.renter.token), context(id))).status,
    ).toBe(403)
  })
  it('lets only the linked renter contest a pending resolution and records the audit', async () => {
    const id = await create(fixture.owner.token)
    await prisma.chamadoManutencao.update({
      where: { id },
      data: { status: 'AGUARDANDO_CONFIRMACAO' },
    })
    const pending = await getTicket(
      request(`tickets/${id}`, 'GET', fixture.renter.token),
      context(id),
    )
    expect((await pending.json()).ticket.permissions).toMatchObject({
      contest: true,
      confirm: false,
    })
    for (const user of [fixture.unrelated, other.renter]) {
      expect((await action(id, user.token, { action: 'contest', reason: 'Denied' })).status).toBe(
        404,
      )
    }
    expect(
      (await action(id, fixture.renter.token, { action: 'contest', reason: ' ' })).status,
    ).toBe(400)
    expect((await action(id, fixture.renter.token, { action: 'confirm' })).status).toBe(403)
    const response = await action(id, fixture.renter.token, {
      action: 'contest',
      reason: 'Still leaking',
    })
    expect(response.status).toBe(200)
    expect((await response.json()).ticket).toMatchObject({ status: 'CONTESTADO', resolvedAt: null })
    const history = await listActivities(
      request(`tickets/${id}/activities`, 'GET', fixture.renter.token),
      context(id),
    )
    expect((await history.json()).activities).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'MUDANCA_STATUS',
          authorId: fixture.renter.id,
          message: 'Still leaking',
          details: { before: 'AGUARDANDO_CONFIRMACAO', after: 'CONTESTADO' },
        }),
      ]),
    )
    expect(
      (await action(id, fixture.renter.token, { action: 'contest', reason: 'Again' })).status,
    ).toBe(403)
  })
  it.each(['ABERTO', 'EM_ANDAMENTO', 'RESOLVIDO', 'CANCELADO', 'FECHADO'] as const)(
    'rejects renter contestation in %s',
    async (status) => {
      const id = await create()
      await prisma.chamadoManutencao.update({ where: { id }, data: { status } })
      expect(
        (await action(id, fixture.renter.token, { action: 'contest', reason: 'Denied' })).status,
      ).toBe(['RESOLVIDO', 'CANCELADO', 'FECHADO'].includes(status) ? 409 : 403)
    },
  )
  it('rejects renter contestation of archived tickets', async () => {
    const id = await create()
    await prisma.chamadoManutencao.update({
      where: { id },
      data: { status: 'AGUARDANDO_CONFIRMACAO', excluidoEm: new Date() },
    })
    expect(
      (await action(id, fixture.renter.token, { action: 'contest', reason: 'Denied' })).status,
    ).toBe(404)
  })
  it('preserves original data and history when a linked renter adds notes and reopens a resolved ticket', async () => {
    const id = await create(fixture.admin.token)
    const resolvedAt = new Date('2026-10-19T10:00:00Z')
    await prisma.chamadoManutencao.update({
      where: { id },
      data: {
        status: 'RESOLVIDO',
        resolvidoEm: resolvedAt,
        concluidoPorId: fixture.agent.id,
        concluidoPorPapel: 'AGENT',
      },
    })
    const before = await prisma.chamadoManutencao.findUniqueOrThrow({ where: { id } })
    const note = await addNote(
      request(`tickets/${id}/notes`, 'POST', fixture.renter.token, {
        message: ' Additional detail ',
      }),
      context(id),
    )
    expect(note.status).toBe(201)
    const noteBody = await note.json()
    const afterNote = await prisma.chamadoManutencao.findUniqueOrThrow({ where: { id } })
    expect(afterNote).toMatchObject({
      status: 'RESOLVIDO',
      resolvidoEm: resolvedAt,
      titulo: before.titulo,
      descricao: before.descricao,
    })
    for (const user of [fixture.unrelated, other.renter]) {
      expect(
        (await action(id, user.token, { action: 'reopen', status: 'ABERTO', reason: 'Denied' }))
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
    }
    expect(
      (await action(id, fixture.renter.token, { action: 'reopen', status: 'ABERTO' })).status,
    ).toBe(409)
    expect(
      (await action(id, fixture.renter.token, { action: 'reopen', status: 'ABERTO', reason: ' ' }))
        .status,
    ).toBe(400)
    expect(
      (
        await action(id, fixture.renter.token, {
          action: 'reopen',
          status: 'EM_ANDAMENTO',
          reason: 'Denied',
        })
      ).status,
    ).toBe(403)
    const reopened = await action(id, fixture.renter.token, {
      action: 'reopen',
      status: 'ABERTO',
      reason: ' Leak returned ',
    })
    expect(reopened.status).toBe(200)
    const body = await reopened.json()
    expect(body.ticket).toMatchObject({
      status: 'ABERTO',
      resolvedAt: null,
      title: before.titulo,
      description: before.descricao,
      category: before.categoria,
      priority: before.prioridade,
      contractId: before.contratoId,
      propertyId: before.imovelId,
      permissions: { edit: false, comment: true, collaborate: true },
    })
    expect(body.ticket.activities).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ message: 'Chamado aberto.' }),
        expect.objectContaining({
          id: noteBody.activity.id,
          message: 'Additional detail',
          authorId: fixture.renter.id,
        }),
        expect.objectContaining({
          type: 'MUDANCA_STATUS',
          authorId: fixture.renter.id,
          message: 'Leak returned',
          details: {
            before: 'RESOLVIDO',
            after: 'ABERTO',
            reason: 'Leak returned',
            previousResolution: { resolvedAt: resolvedAt.toISOString(), completedByRole: 'AGENT' },
          },
        }),
      ]),
    )
    expect(
      (
        await PATCH(
          request(`tickets/${id}`, 'PATCH', fixture.renter.token, { description: 'Overwrite' }),
          context(id),
        )
      ).status,
    ).toBe(403)
    expect(
      (
        await action(id, fixture.renter.token, {
          action: 'reopen',
          status: 'ABERTO',
          reason: 'Repeat',
        })
      ).status,
    ).toBe(403)
  })
  it.each(['CANCELADO', 'FECHADO'] as const)(
    'blocks renter reopening of %s tickets',
    async (status) => {
      const id = await create()
      await prisma.chamadoManutencao.update({ where: { id }, data: { status } })
      expect(
        (
          await action(id, fixture.renter.token, {
            action: 'reopen',
            status: 'ABERTO',
            reason: 'Denied',
          })
        ).status,
      ).toBe(409)
    },
  )
  it('blocks renter notes and reopening of archived resolved tickets', async () => {
    const id = await create()
    await prisma.chamadoManutencao.update({
      where: { id },
      data: { status: 'RESOLVIDO', excluidoEm: new Date() },
    })
    expect(
      (
        await action(id, fixture.renter.token, {
          action: 'reopen',
          status: 'ABERTO',
          reason: 'Denied',
        })
      ).status,
    ).toBe(404)
    expect(
      (
        await addNote(
          request(`tickets/${id}/notes`, 'POST', fixture.renter.token, { message: 'Denied' }),
          context(id),
        )
      ).status,
    ).toBe(404)
  })
  it.each(['ABERTO', 'EM_ANDAMENTO', 'AGUARDANDO_CONFIRMACAO', 'CONTESTADO'] as const)(
    'lets the linked renter finish %s directly and preserves the ticket history and original data',
    async (status) => {
      const id = await create(fixture.admin.token)
      await prisma.chamadoManutencao.update({ where: { id }, data: { status } })
      const before = await prisma.chamadoManutencao.findUniqueOrThrow({ where: { id } })
      const detail = await getTicket(
        request(`tickets/${id}`, 'GET', fixture.renter.token),
        context(id),
      )
      expect((await detail.json()).ticket.permissions).toMatchObject({
        finish: true,
        edit: false,
        delete: false,
      })
      for (const user of [fixture.unrelated, other.renter]) {
        expect((await action(id, user.token, { action: 'finish' })).status).toBe(404)
      }
      for (const user of [fixture.admin, fixture.agent, fixture.owner]) {
        expect((await action(id, user.token, { action: 'finish' })).status).toBe(403)
      }
      const response = await action(id, fixture.renter.token, {
        action: 'finish',
        title: 'Overwrite',
        description: 'Overwrite',
      })
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.ticket).toMatchObject({
        status: 'RESOLVIDO',
        title: before.titulo,
        description: before.descricao,
        propertyId: before.imovelId,
        contractId: before.contratoId,
        category: before.categoria,
        priority: before.prioridade,
        permissions: {
          finish: false,
          edit: false,
          delete: false,
          comment: true,
          reopen: true,
          collaborate: false,
        },
      })
      expect(body.ticket.resolvedAt).toEqual(expect.any(String))
      expect(body.ticket.activities).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ message: 'Chamado aberto.' }),
          expect.objectContaining({
            type: 'MUDANCA_STATUS',
            authorId: fixture.renter.id,
            details: {
              before: status,
              after: 'RESOLVIDO',
              resolvedAt: body.ticket.resolvedAt,
              previousCompletionRole: null,
            },
          }),
        ]),
      )
      const stored = await prisma.chamadoManutencao.findUniqueOrThrow({ where: { id } })
      expect(stored).toMatchObject({
        concluidoPorId: fixture.renter.id,
        concluidoPorPapel: 'RENTER',
        resolvidoEm: new Date(body.ticket.resolvedAt),
      })
      expect((await action(id, fixture.renter.token, { action: 'finish' })).status).toBe(409)
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
          await action(id, fixture.renter.token, {
            action: 'reopen',
            status: 'ABERTO',
            reason: 'Problem returned',
          })
        ).status,
      ).toBe(200)
      expect((await action(id, fixture.renter.token, { action: 'finish' })).status).toBe(200)
    },
  )
  it.each(['RESOLVIDO', 'CANCELADO', 'FECHADO'] as const)(
    'blocks renter finalization of %s tickets',
    async (status) => {
      const id = await create()
      await prisma.chamadoManutencao.update({ where: { id }, data: { status } })
      expect((await action(id, fixture.renter.token, { action: 'finish' })).status).toBe(409)
    },
  )
  it('blocks renter finalization of archived and legacy tickets', async () => {
    const archived = await create()
    await prisma.chamadoManutencao.update({
      where: { id: archived },
      data: { excluidoEm: new Date() },
    })
    expect((await action(archived, fixture.renter.token, { action: 'finish' })).status).toBe(404)
    const legacy = await create()
    await prisma.chamadoManutencao.update({ where: { id: legacy }, data: { contratoId: null } })
    expect((await action(legacy, fixture.renter.token, { action: 'finish' })).status).toBe(404)
  })
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
  it('stores appointment dates and returns them on renter lists while staff retains rescheduling control', async () => {
    const id = await create(fixture.renter.token)
    const scheduledAt = '2026-10-24T14:00:00.000Z'
    expect(
      (await action(id, fixture.renter.token, { action: 'schedule', scheduledAt })).status,
    ).toBe(403)
    expect(
      (
        await PATCH(
          request(`tickets/${id}`, 'PATCH', fixture.admin.token, { scheduledAt }),
          context(id),
        )
      ).status,
    ).toBe(403)
    expect(
      (
        await action(id, fixture.renter.token, {
          action: 'provider',
          provider: { name: 'Selected provider' },
        })
      ).status,
    ).toBe(200)
    expect(
      (await action(id, fixture.renter.token, { action: 'schedule', scheduledAt })).status,
    ).toBe(200)
    expect(
      (await action(id, fixture.unrelated.token, { action: 'schedule', scheduledAt })).status,
    ).toBe(404)
    const updated = await PATCH(
      request(`tickets/${id}`, 'PATCH', fixture.admin.token, { scheduledAt }),
      context(id),
    )
    expect(updated.status).toBe(200)
    expect((await updated.json()).ticket.scheduledAt).toBe(scheduledAt)
    const list = await GET(request('tickets', 'GET', fixture.renter.token))
    expect((await list.json()).items).toContainEqual(expect.objectContaining({ id, scheduledAt }))
    expect(
      (
        await PATCH(
          request(`tickets/${id}`, 'PATCH', fixture.renter.token, { scheduledAt: null }),
          context(id),
        )
      ).status,
    ).toBe(403)
    expect(
      (
        await PATCH(
          request(`tickets/${id}`, 'PATCH', fixture.admin.token, { scheduledAt: 'invalid' }),
          context(id),
        )
      ).status,
    ).toBe(400)
    const removed = await PATCH(
      request(`tickets/${id}`, 'PATCH', fixture.admin.token, { scheduledAt: null }),
      context(id),
    )
    expect((await removed.json()).ticket.scheduledAt).toBeNull()
    const detail = await getTicket(
      request(`tickets/${id}`, 'GET', fixture.renter.token),
      context(id),
    )
    expect((await detail.json()).ticket.activities).toContainEqual(
      expect.objectContaining({
        authorId: fixture.renter.id,
        type: 'EDICAO',
        details: {
          before: { scheduledAt: null },
          after: { scheduledAt },
          provider: 'Selected provider',
        },
      }),
    )
  })
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
  it('allows renter notes but never edits original fields, including own OPEN calls', async () => {
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
          request(`tickets/${own}`, 'PATCH', fixture.renter.token, { title: 'Denied' }),
          context(own),
        )
      ).status,
    ).toBe(403)
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
  it.each(['ABERTO', 'EM_ANDAMENTO', 'AGUARDANDO_CONFIRMACAO', 'CONTESTADO'] as const)(
    'lets the linked renter define a provider in %s and preserves original data and history',
    async (status) => {
      const id = await create(fixture.admin.token)
      await prisma.chamadoManutencao.update({ where: { id }, data: { status } })
      const before = await prisma.chamadoManutencao.findUniqueOrThrow({ where: { id } })
      for (const user of [fixture.unrelated, other.renter]) {
        expect(
          (await action(id, user.token, { action: 'provider', provider: { name: 'Denied' } }))
            .status,
        ).toBe(404)
      }
      expect(
        (await action(id, fixture.renter.token, { action: 'provider', provider: { name: ' ' } }))
          .status,
      ).toBe(400)
      const provider = {
        name: 'Chosen provider',
        phone: '51999990000',
        email: 'provider@example.test',
        notes: 'Plumbing',
      }
      const response = await action(id, fixture.renter.token, {
        action: 'provider',
        provider,
        title: 'Overwrite',
      })
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.ticket).toMatchObject({
        provider,
        status,
        title: before.titulo,
        description: before.descricao,
        contractId: before.contratoId,
        propertyId: before.imovelId,
        permissions: { provider: true, edit: false, delete: false },
      })
      const updated = await action(id, fixture.renter.token, {
        action: 'provider',
        provider: { ...provider, name: 'New provider' },
      })
      expect(updated.status).toBe(200)
      const ticket = (await updated.json()).ticket
      expect(ticket.activities).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ message: 'Chamado aberto.' }),
          expect.objectContaining({
            type: 'PRESTADOR_ALTERADO',
            authorId: fixture.renter.id,
            details: { before: null, after: provider },
          }),
          expect.objectContaining({
            type: 'PRESTADOR_ALTERADO',
            authorId: fixture.renter.id,
            details: { before: provider, after: { ...provider, name: 'New provider' } },
          }),
        ]),
      )
    },
  )
  it.each(['RESOLVIDO', 'CANCELADO', 'FECHADO'] as const)(
    'blocks renter provider changes in %s',
    async (status) => {
      const id = await create()
      await prisma.chamadoManutencao.update({ where: { id }, data: { status } })
      expect(
        (
          await action(id, fixture.renter.token, {
            action: 'provider',
            provider: { name: 'Denied' },
          })
        ).status,
      ).toBe(409)
    },
  )
  it('blocks renter provider changes on archived and legacy tickets', async () => {
    const archived = await create()
    await prisma.chamadoManutencao.update({
      where: { id: archived },
      data: { excluidoEm: new Date() },
    })
    const legacy = await create()
    await prisma.chamadoManutencao.update({ where: { id: legacy }, data: { contratoId: null } })
    for (const id of [archived, legacy])
      expect(
        (
          await action(id, fixture.renter.token, {
            action: 'provider',
            provider: { name: 'Denied' },
          })
        ).status,
      ).toBe(404)
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
        await action(id, fixture.renter.token, {
          action: 'provider',
          provider: { name: 'Blocked while pending' },
        })
      ).status,
    ).toBe(409)
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
