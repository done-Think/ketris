import { randomUUID } from 'node:crypto'

import type { User } from '@prisma/client'
import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { prisma } from '@server/db/prisma'

import { POST as CANCEL } from '../../events/[id]/cancel/route'
import { POST as RESCHEDULE } from '../../events/[id]/reschedule/route'
import { GET as GET_ONE, PATCH } from '../../events/[id]/route'
import { GET as LIST, POST as CREATE } from '../../events/route'
import { propertyResponsibleId } from '@server/shared/tests/fixtures/property-responsible'

const RENTER_VIEW_KEYS = [
  'end',
  'id',
  'kind',
  'propertyId',
  'propertyReference',
  'propertyLabel',
  'responsibleName',
  'start',
  'status',
  'title',
].sort()

const PERIOD = 'from=2031-03-01T00:00:00.000Z&to=2031-03-08T00:00:00.000Z'

describe('/api/agenda/events — leitura do RENTER por vínculo explícito (integração)', () => {
  const tokenService = new JoseTokenService()
  const suffix = randomUUID()
  const tenantIds: string[] = []

  let agencyTenantId: string
  let otherAgencyTenantId: string
  let staff: User
  let otherStaffSameTenant: User
  let otherTenantStaff: User
  let renterOwner: User
  let renterParticipant: User
  let renterOutsider: User
  let inactiveRenter: User

  let staffToken: string
  let otherTenantStaffToken: string
  let renterOwnerToken: string
  let renterParticipantToken: string
  let renterOutsiderToken: string

  let ownedEventId: string
  let participatedEventId: string
  let thirdPartyEventId: string
  let otherTenantEventId: string

  async function createTenant(name: string) {
    const tenant = await prisma.tenant.create({
      data: { name, slug: `${name.toLowerCase().replace(/\s+/g, '-')}-${suffix}` },
    })
    tenantIds.push(tenant.id)
    return tenant.id
  }

  function createUser(
    tenantId: string,
    role: User['role'],
    label: string,
    overrides: Partial<Pick<User, 'active'>> = {},
  ) {
    return prisma.user.create({
      data: {
        tenantId,
        name: `${label} Agenda`,
        email: `${label.toLowerCase()}-agenda-${suffix}@ketris.dev`,
        passwordHash: 'hash-fake',
        role,
        ...overrides,
      },
    })
  }

  function sign(user: User) {
    return tokenService.sign({
      id: user.id,
      tenantId: user.tenantId,
      name: user.name,
      email: user.email,
      role: user.role,
      active: user.active,
      membershipApprovedAt: user.membershipApprovedAt,
    })
  }

  function createEvent(data: {
    tenantId: string
    responsibleId: string
    title: string
    start: string
    ownerUserId?: string
    participantIds?: string[]
  }) {
    const start = new Date(data.start)

    return prisma.agendaEvent.create({
      data: {
        tenantId: data.tenantId,
        responsibleId: data.responsibleId,
        createdById: data.responsibleId,
        ownerUserId: data.ownerUserId ?? null,
        title: data.title,
        type: 'INSPECTION',
        freeFormPropertyReference: 'Apto 12',
        start,
        end: new Date(start.getTime() + 60 * 60_000),
        participantName: 'Contato Interno',
        participantPhone: '(11) 90000-1234',
        notes: 'Nota interna da imobiliária',
        participants: data.participantIds
          ? { create: data.participantIds.map((userId) => ({ userId })) }
          : undefined,
      },
    })
  }

  function request(method: string, url: string, token: string, body?: unknown) {
    if (url.endsWith('/cancel') && body === undefined) body = { reason: 'Cliente indisponível' }
    return new NextRequest(url, {
      method,
      ...(body ? { body: JSON.stringify(body) } : {}),
      headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
    })
  }

  function context(id: string) {
    return { params: Promise.resolve({ id }) }
  }

  async function listAs(token: string, query = PERIOD) {
    const response = await LIST(
      request('GET', `http://localhost/api/agenda/events?${query}`, token),
    )
    return { status: response.status, json: await response.json() }
  }

  async function getAs(token: string, id: string) {
    const response = await GET_ONE(
      request('GET', `http://localhost/api/agenda/events/${id}`, token),
      context(id),
    )
    return { status: response.status, json: await response.json() }
  }

  async function patchAs(token: string, id: string, body: unknown) {
    const response = await PATCH(
      request('PATCH', `http://localhost/api/agenda/events/${id}`, token, body),
      context(id),
    )
    return { status: response.status, json: await response.json() }
  }

  async function createAs(token: string, body: Record<string, unknown>) {
    const response = await CREATE(
      request('POST', 'http://localhost/api/agenda/events', token, {
        propertyReference: 'Apto 12',
        durationMinutes: 30,
        participantName: 'Contato',
        participantPhone: '(11) 90000-0000',
        ...body,
      }),
    )
    return { status: response.status, json: await response.json() }
  }

  beforeAll(async () => {
    agencyTenantId = await createTenant('Imobiliaria A')
    otherAgencyTenantId = await createTenant('Imobiliaria B')
    const rentersTenantId = await createTenant('Locatarios Compartilhado')

    staff = await createUser(agencyTenantId, 'AGENT', 'Corretora')
    otherStaffSameTenant = await createUser(agencyTenantId, 'AGENT', 'Corretor2')
    otherTenantStaff = await createUser(otherAgencyTenantId, 'AGENT', 'CorretorB')
    renterOwner = await createUser(rentersTenantId, 'RENTER', 'LocatarioDono')
    renterParticipant = await createUser(rentersTenantId, 'RENTER', 'LocatarioParticipante')
    renterOutsider = await createUser(rentersTenantId, 'RENTER', 'LocatarioTerceiro')
    inactiveRenter = await createUser(rentersTenantId, 'RENTER', 'LocatarioInativo', {
      active: false,
    })

    staffToken = await sign(staff)
    otherTenantStaffToken = await sign(otherTenantStaff)
    renterOwnerToken = await sign(renterOwner)
    renterParticipantToken = await sign(renterParticipant)
    renterOutsiderToken = await sign(renterOutsider)

    ownedEventId = (
      await createEvent({
        tenantId: agencyTenantId,
        responsibleId: staff.id,
        title: 'Vistoria do dono',
        start: '2031-03-03T13:00:00.000Z',
        ownerUserId: renterOwner.id,
      })
    ).id
    participatedEventId = (
      await createEvent({
        tenantId: agencyTenantId,
        responsibleId: otherStaffSameTenant.id,
        title: 'Vistoria com participante',
        start: '2031-03-04T13:00:00.000Z',
        participantIds: [renterParticipant.id],
      })
    ).id
    thirdPartyEventId = (
      await createEvent({
        tenantId: agencyTenantId,
        responsibleId: staff.id,
        title: 'Evento de terceiros',
        start: '2031-03-05T13:00:00.000Z',
      })
    ).id
    otherTenantEventId = (
      await createEvent({
        tenantId: otherAgencyTenantId,
        responsibleId: otherTenantStaff.id,
        title: 'Evento de outra imobiliária',
        start: '2031-03-03T13:00:00.000Z',
      })
    ).id
  })

  afterAll(async () => {
    for (const tenantId of tenantIds) {
      await prisma.tenant.delete({ where: { id: tenantId } }).catch(() => null)
    }
    await prisma.$disconnect()
  })

  describe('listagem (GET /agenda/events)', () => {
    it('dono lista somente o seu evento, na visão reduzida', async () => {
      const { status, json } = await listAs(renterOwnerToken)

      expect(status).toBe(200)
      expect(json.events.map((event: { id: string }) => event.id)).toEqual([ownedEventId])
      expect(Object.keys(json.events[0]).sort()).toEqual(RENTER_VIEW_KEYS)
      expect(json.events[0].responsibleName).toBe(staff.name)
    })

    it('participante lista somente o evento em que participa', async () => {
      const { status, json } = await listAs(renterParticipantToken)

      expect(status).toBe(200)
      expect(json.events.map((event: { id: string }) => event.id)).toEqual([participatedEventId])
    })

    it('eventos de terceiros do mesmo tenant e de outro tenant não aparecem para o RENTER', async () => {
      const { status, json } = await listAs(renterOutsiderToken)

      expect(status).toBe(200)
      expect(json.events).toEqual([])
    })

    it('a resposta do RENTER não expõe notas, contato do participante, e-mails nem IDs internos', async () => {
      const { json } = await listAs(renterOwnerToken)
      const serialized = JSON.stringify(json)

      expect(serialized).not.toContain('Nota interna')
      expect(serialized).not.toContain('90000-1234')
      expect(serialized).not.toContain('Contato Interno')
      expect(serialized).not.toContain(renterOwner.email)
      expect(serialized).not.toContain(staff.id)
      expect(serialized).not.toContain(agencyTenantId)
    })

    it('mantém os filtros de período e responsável para o RENTER', async () => {
      const otherResponsible = await listAs(
        renterOwnerToken,
        `${PERIOD}&responsibleId=${otherStaffSameTenant.id}`,
      )
      const sameResponsible = await listAs(renterOwnerToken, `${PERIOD}&responsibleId=${staff.id}`)
      const outsidePeriod = await listAs(
        renterOwnerToken,
        'from=2031-04-01T00:00:00.000Z&to=2031-04-08T00:00:00.000Z',
      )

      expect(otherResponsible.json.events).toEqual([])
      expect(sameResponsible.json.events.map((event: { id: string }) => event.id)).toEqual([
        ownedEventId,
      ])
      expect(outsidePeriod.json.events).toEqual([])
    })

    it('equipe continua vendo toda a agenda do próprio tenant, e só dele, na visão completa', async () => {
      const { status, json } = await listAs(staffToken)
      const ids = json.events.map((event: { id: string }) => event.id)

      expect(status).toBe(200)
      expect(ids).toEqual(
        expect.arrayContaining([ownedEventId, participatedEventId, thirdPartyEventId]),
      )
      expect(ids).not.toContain(otherTenantEventId)

      const owned = json.events.find((event: { id: string }) => event.id === ownedEventId)
      expect(owned.notes).toBe('Nota interna da imobiliária')
      expect(owned.owner).toEqual({ name: renterOwner.name, email: renterOwner.email })
    })
  })

  describe('consulta por ID (GET /agenda/events/{id})', () => {
    it('dono e participante consultam o próprio evento', async () => {
      const owner = await getAs(renterOwnerToken, ownedEventId)
      const participant = await getAs(renterParticipantToken, participatedEventId)

      expect(owner.status).toBe(200)
      expect(Object.keys(owner.json.event).sort()).toEqual(RENTER_VIEW_KEYS)
      expect(participant.status).toBe(200)
      expect(participant.json.event.id).toBe(participatedEventId)
    })

    it.each([
      ['evento de terceiros do mesmo tenant', () => thirdPartyEventId],
      ['evento em que outro locatário participa', () => participatedEventId],
      ['evento de outro tenant', () => otherTenantEventId],
      ['ID inexistente', () => 'evento-inexistente'],
    ])('retorna 404 para o RENTER em %s', async (_, eventId) => {
      const { status, json } = await getAs(renterOwnerToken, eventId())

      expect(status).toBe(404)
      expect(json.error.code).toBe('NOT_FOUND')
      expect(json.event).toBeUndefined()
    })

    it('equipe de outro tenant não consulta evento desta imobiliária', async () => {
      const { status } = await getAs(otherTenantStaffToken, ownedEventId)

      expect(status).toBe(404)
    })

    it('equipe de outro tenant não edita nem altera vínculos de evento desta imobiliária', async () => {
      const { status } = await patchAs(otherTenantStaffToken, ownedEventId, {
        ownerEmail: renterOutsider.email,
        participantEmails: [renterOutsider.email],
      })

      expect(status).toBe(404)

      const stored = await prisma.agendaEvent.findUniqueOrThrow({
        where: { id: ownedEventId },
        include: { participants: true },
      })
      expect(stored.ownerUserId).toBe(renterOwner.id)
      expect(stored.participants).toEqual([])
      expect((await getAs(renterOutsiderToken, ownedEventId)).status).toBe(404)
    })
  })

  describe('gerenciamento pelo RENTER', () => {
    it('RENTER não altera evento criado pela equipe, mesmo sendo o dono vinculado', async () => {
      const update = await patchAs(renterOwnerToken, ownedEventId, { title: 'Alterado' })
      const reschedule = await RESCHEDULE(
        request(
          'POST',
          `http://localhost/api/agenda/events/${ownedEventId}/reschedule`,
          renterOwnerToken,
          { start: '2031-03-06T14:00:00.000Z' },
        ),
        context(ownedEventId),
      )
      const cancel = await CANCEL(
        request(
          'POST',
          `http://localhost/api/agenda/events/${ownedEventId}/cancel`,
          renterOwnerToken,
        ),
        context(ownedEventId),
      )

      expect([update.status, reschedule.status, cancel.status]).toEqual([403, 403, 403])

      const stored = await prisma.agendaEvent.findUniqueOrThrow({ where: { id: ownedEventId } })
      expect(stored.title).toBe('Vistoria do dono')
      expect(stored.status).toBe('CONFIRMED')
      expect(stored.start.toISOString()).toBe('2031-03-03T13:00:00.000Z')
    })

    it('RENTER não cria evento com imóvel avulso, só com o imóvel do contrato', async () => {
      const create = await createAs(renterOwnerToken, {
        title: 'Tentativa do locatário',
        start: '2031-03-06T13:00:00.000Z',
      })

      expect(create.status).toBe(409)
    })

    it('RENTER cria evento no imóvel que aluga, na agenda da imobiliária, e edita o que criou', async () => {
      const property = await prisma.property.create({
        data: {
          tenantId: agencyTenantId,
          responsibleId: staff.id,
          title: 'Apto alugado',
          purpose: 'RENT',
          type: 'APARTMENT',
          price: 1000,
        },
      })
      const opportunity = await prisma.opportunity.create({
        data: {
          tenantId: agencyTenantId,
          propertyId: property.id,
          responsibleId: await propertyResponsibleId(prisma, property.id),
          interestedName: renterOwner.name,
          interestedEmail: renterOwner.email,
          proposedValue: 1000,
          status: 'ACCEPTED',
        },
      })
      await prisma.contract.create({
        data: {
          tenantId: agencyTenantId,
          propertyId: property.id,
          sourceOpportunityId: opportunity.id,
          code: randomUUID(),
          amount: 1000,
          dueDay: 5,
          startDate: new Date('2026-01-01'),
          endDate: new Date('2032-01-01'),
          adjustmentIndex: 'IPCA',
          guaranteeType: 'DEPOSIT',
          status: 'ACTIVE',
          parties: {
            create: {
              role: 'RENTER',
              name: renterOwner.name,
              cpf: '00000000000',
              email: renterOwner.email,
              userId: renterOwner.id,
            },
          },
        },
      })

      const created = await createAs(renterOwnerToken, {
        title: 'Vistoria pedida pelo locatário',
        start: '2031-03-07T13:00:00.000Z',
        propertyId: property.id,
        propertyReference: undefined,
      })

      expect(created.status).toBe(201)
      expect(created.json.event.tenantId).toBe(agencyTenantId)
      expect(created.json.event.createdById).toBe(renterOwner.id)

      const updated = await patchAs(renterOwnerToken, created.json.event.id, {
        title: 'Vistoria remarcada pelo locatário',
      })
      expect(updated.status).toBe(200)
      expect(updated.json.event.title).toBe('Vistoria remarcada pelo locatário')

      const asStaff = await getAs(staffToken, created.json.event.id)
      expect(asStaff.status).toBe(200)

      await prisma.agendaEvent.delete({ where: { id: created.json.event.id } })
    })
  })

  describe('vínculos por e-mail', () => {
    it('equipe vincula dono RENTER do tenant compartilhado e participantes ao criar', async () => {
      const { status, json } = await createAs(staffToken, {
        title: 'Vistoria de entrada vinculada',
        start: '2031-03-06T13:00:00.000Z',
        ownerEmail: renterOwner.email.toUpperCase(),
        participantEmails: [renterParticipant.email, otherStaffSameTenant.email],
      })

      expect(status).toBe(201)
      expect(json.event.tenantId).toBe(agencyTenantId)
      expect(json.event.owner).toEqual({ name: renterOwner.name, email: renterOwner.email })
      expect(json.event.participants).toEqual([
        { name: renterParticipant.name, email: renterParticipant.email },
        { name: otherStaffSameTenant.name, email: otherStaffSameTenant.email },
      ])

      const asOwner = await getAs(renterOwnerToken, json.event.id)
      const asParticipant = await getAs(renterParticipantToken, json.event.id)
      expect(asOwner.status).toBe(200)
      expect(asParticipant.status).toBe(200)
    })

    it('rejeita tenantId forjado como campo desconhecido no corpo', async () => {
      const { status, json } = await createAs(staffToken, {
        title: 'Evento com tenant forjado',
        start: '2031-03-06T15:00:00.000Z',
        tenantId: otherAgencyTenantId,
      })

      expect(status).toBe(400)
      expect(json.error.code).toBe('VALIDATION_ERROR')
      expect(
        await prisma.agendaEvent.count({ where: { title: 'Evento com tenant forjado' } }),
      ).toBe(0)
    })

    it('rejeita com a MESMA resposta e-mail inexistente, usuário inativo e equipe de outro tenant', async () => {
      const unknownEmail = `inexistente-${suffix}@ketris.dev`
      const cases = [unknownEmail, inactiveRenter.email, otherTenantStaff.email]
      const responses = []

      for (const [index, email] of cases.entries()) {
        responses.push(
          await createAs(staffToken, {
            title: `Vínculo inválido ${index}`,
            start: '2031-03-06T17:00:00.000Z',
            participantEmails: [email],
          }),
        )
      }

      for (const [index, response] of responses.entries()) {
        expect(response.status).toBe(400)
        expect(response.json.error.code).toBe('AGENDA_EVENT_USER_LINK_UNAVAILABLE')
        expect(response.json.error.message).toBe(
          `Não foi possível vincular o e-mail ${cases[index]} a este evento.`,
        )
      }

      // Atomicidade na criação: nenhum dos eventos rejeitados foi gravado.
      const created = await prisma.agendaEvent.count({
        where: { tenantId: agencyTenantId, title: { startsWith: 'Vínculo inválido' } },
      })
      expect(created).toBe(0)
    })

    it('na edição: omitido mantém, e-mail troca o dono, null remove o dono', async () => {
      const { json } = await createAs(staffToken, {
        title: 'Evento para editar dono',
        start: '2031-03-07T13:00:00.000Z',
        ownerEmail: renterOwner.email,
        participantEmails: [renterParticipant.email],
      })
      const eventId = json.event.id

      const keep = await patchAs(staffToken, eventId, { title: 'Só o título' })
      expect(keep.status).toBe(200)
      expect(keep.json.event.owner.email).toBe(renterOwner.email)
      expect(keep.json.event.participants).toHaveLength(1)

      const swap = await patchAs(staffToken, eventId, { ownerEmail: renterOutsider.email })
      expect(swap.json.event.owner.email).toBe(renterOutsider.email)
      expect((await getAs(renterOwnerToken, eventId)).status).toBe(404)
      expect((await getAs(renterOutsiderToken, eventId)).status).toBe(200)

      const remove = await patchAs(staffToken, eventId, { ownerEmail: null })
      expect(remove.json.event.owner).toBeNull()
      expect((await getAs(renterOutsiderToken, eventId)).status).toBe(404)
      expect(remove.json.event.participants).toHaveLength(1)
    })

    it('na edição: lista substitui os participantes e [] remove todos', async () => {
      const { json } = await createAs(staffToken, {
        title: 'Evento para editar participantes',
        start: '2031-03-07T15:00:00.000Z',
        participantEmails: [renterParticipant.email],
      })
      const eventId = json.event.id

      const replace = await patchAs(staffToken, eventId, {
        participantEmails: [renterOutsider.email],
      })
      expect(replace.json.event.participants).toEqual([
        { name: renterOutsider.name, email: renterOutsider.email },
      ])
      expect((await getAs(renterParticipantToken, eventId)).status).toBe(404)

      const clear = await patchAs(staffToken, eventId, { participantEmails: [] })
      expect(clear.json.event.participants).toEqual([])
      expect((await getAs(renterOutsiderToken, eventId)).status).toBe(404)
    })

    it('na edição, um vínculo inválido desfaz toda a alteração (atomicidade)', async () => {
      const { json } = await createAs(staffToken, {
        title: 'Evento atômico',
        start: '2031-03-07T17:00:00.000Z',
        participantEmails: [renterParticipant.email],
      })
      const eventId = json.event.id

      const failed = await patchAs(staffToken, eventId, {
        title: 'Título que não deve ser salvo',
        participantEmails: [renterOutsider.email, otherTenantStaff.email],
      })
      expect(failed.status).toBe(400)
      expect(failed.json.error.code).toBe('AGENDA_EVENT_USER_LINK_UNAVAILABLE')

      const stored = await getAs(staffToken, eventId)
      expect(stored.json.event.title).toBe('Evento atômico')
      expect(stored.json.event.participants).toEqual([
        { name: renterParticipant.name, email: renterParticipant.email },
      ])
    })
  })
})
