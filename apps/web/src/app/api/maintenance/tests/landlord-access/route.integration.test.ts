import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { prisma } from '@server/db/prisma'
import {
  createLandlordScenario,
  createLandlordTenant,
  createLandlordUser,
  landlordRequest,
  linkLandlordAccount,
  removeLandlordTenants,
  routeContext,
} from '@server/shared/tests/fixtures/landlord-contract'
import { GET as listTickets, POST as createTicket } from '../../tickets/route'
import { GET as readTicket } from '../../tickets/[id]/route'
import { POST as addNote } from '../../tickets/[id]/notes/route'
import { POST as actOnTicket } from '../../tickets/[id]/actions/route'
import { GET as options } from '../../options/route'

const tenantIds: string[] = []
const ids = (items: { id: string }[]) => items.map((item) => item.id)

describe('O dono do imóvel vinculado como Locador acompanha e abre chamados do imóvel', () => {
  let s: Awaited<ReturnType<typeof createLandlordScenario>>

  beforeEach(async () => {
    s = await createLandlordScenario(tenantIds)
  })

  afterAll(async () => {
    await removeLandlordTenants(tenantIds)
    await prisma.$disconnect()
  })

  const read = async (token: string) =>
    readTicket(
      landlordRequest(`maintenance/tickets/${s.ticket.id}`, token),
      routeContext(s.ticket.id),
    )
  const list = async (token: string) =>
    (await (await listTickets(landlordRequest('maintenance/tickets', token))).json()).items
  const open = (token: string) =>
    createTicket(
      landlordRequest('maintenance/tickets', token, {
        contractId: s.contract.id,
        propertyId: s.property.id,
        title: 'Infiltração no teto',
        description: 'Mancha no quarto',
        category: 'PLUMBING',
        priority: 'NORMAL',
      }),
    )
  const act = (token: string, body: unknown) =>
    actOnTicket(
      landlordRequest(`maintenance/tickets/${s.ticket.id}/actions`, token, body),
      routeContext(s.ticket.id),
    )

  it('antes do vínculo o dono não vê nem abre chamados do imóvel da imobiliária', async () => {
    expect((await read(s.landlord.token)).status).toBe(404)
    expect(await list(s.landlord.token)).toEqual([])
    expect((await open(s.landlord.token)).status).toBe(404)
  })

  it('depois do vínculo o dono vê os chamados do imóvel, só podendo comentar', async () => {
    await linkLandlordAccount(s.party.id, s.landlord.id)
    expect(ids(await list(s.landlord.token))).toEqual([s.ticket.id])
    const ticket = await (await read(s.landlord.token)).json()
    expect(ticket.ticket.permissions).toMatchObject({
      comment: true,
      edit: false,
      cancel: false,
      delete: false,
      assign: false,
      provider: false,
      schedule: false,
      linkContract: false,
    })
    const choices = await (
      await options(landlordRequest('maintenance/options', s.landlord.token))
    ).json()
    expect(ids(choices.contracts)).toEqual([s.contract.id])
    expect(ids(choices.users)).not.toContain(s.admin.id)
    expect(ids(choices.users)).not.toContain(s.agent.id)
  })

  it('o dono abre chamado e comenta; o chamado fica com a imobiliária', async () => {
    await linkLandlordAccount(s.party.id, s.landlord.id)
    const created = await open(s.landlord.token)
    expect(created.status).toBe(201)
    const ticket = (await created.json()).ticket
    expect(
      (await prisma.maintenanceTicket.findUniqueOrThrow({ where: { id: ticket.id } })).tenantId,
    ).toBe(s.agency.id)
    expect(
      (
        await addNote(
          landlordRequest(`maintenance/tickets/${ticket.id}/notes`, s.landlord.token, {
            message: 'Pode vir na terça',
          }),
          routeContext(ticket.id),
        )
      ).status,
    ).toBe(201)
    expect(ids(await list(s.admin.token))).toContain(ticket.id)
  })

  it('o dono não cancela nem troca o contrato do chamado da imobiliária', async () => {
    await linkLandlordAccount(s.party.id, s.landlord.id)
    expect((await act(s.landlord.token, { action: 'cancel' })).status).toBe(403)
    expect(
      (await act(s.landlord.token, { action: 'linkContract', contractId: s.contract.id })).status,
    ).toBe(403)
    expect(
      (await prisma.maintenanceTicket.findUniqueOrThrow({ where: { id: s.ticket.id } })).status,
    ).toBe('OPEN')
  })

  it('com o contrato encerrado o dono não abre chamado novo', async () => {
    await linkLandlordAccount(s.party.id, s.landlord.id)
    await prisma.contract.update({ where: { id: s.contract.id }, data: { status: 'CLOSED' } })
    const choices = await (
      await options(landlordRequest('maintenance/options', s.landlord.token))
    ).json()
    expect(choices.contracts).toEqual([])
    expect((await open(s.landlord.token)).status).toBe(404)
  })

  it('outra conta de dono não vê os chamados', async () => {
    await linkLandlordAccount(s.party.id, s.landlord.id)
    const other = await createLandlordUser(
      (await createLandlordTenant(tenantIds, 'INDIVIDUAL', 'Outra pessoa')).id,
      'OWNER',
    )
    expect((await read(other.token)).status).toBe(404)
    expect(await list(other.token)).toEqual([])
  })
})
