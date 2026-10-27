import { randomUUID } from 'node:crypto'
import { NextRequest } from 'next/server'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { prisma } from '@server/db/prisma'
import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { linkContractPartyUser } from '@server/contracts/infrastructure/contract-party-user-link'
import { POST as confirmContract } from '../../[id]/parties/[partyId]/link-user/route'
import { POST as confirmMaintenance } from '../../../maintenance/links/route'
import { GET as listTickets, POST as createTicket } from '../../../maintenance/tickets/route'
import { GET as readTicket } from '../../../maintenance/tickets/[id]/route'
import { GET as readActivities } from '../../../maintenance/tickets/[id]/activities/route'
import { POST as addNote } from '../../../maintenance/tickets/[id]/notes/route'
import { POST as uploadAttachment } from '../../../maintenance/tickets/[id]/attachments/route'
import { POST as actOnTicket } from '../../../maintenance/tickets/[id]/actions/route'
import { GET as readMedia } from '../../../maintenance/media/[...key]/route'
import { GET as options } from '../../../maintenance/options/route'
import { GET as listCharges } from '../../../financial/charges/route'
import { GET as readCharge } from '../../../financial/charges/[id]/route'
import { GET as listContracts } from '../../route'
import { GET as readContract } from '../../[id]/route'
import { propertyResponsibleId } from '@server/shared/tests/fixtures/property-responsible'

const { upload, download } = vi.hoisted(() => ({ upload: vi.fn(), download: vi.fn() }))
vi.mock('@server/maintenance/infrastructure/s3-maintenance-attachment-storage', () => ({
  S3MaintenanceAttachmentStorage: class {
    upload = upload
    download = download
  },
}))

type ConfirmationPath = 'contracts' | 'maintenance'
const paths: ConfirmationPath[] = ['contracts', 'maintenance']
const tokens = new JoseTokenService()
const tenantIds: string[] = []
const context = (id: string) => ({ params: Promise.resolve({ id }) })

function request(path: string, token: string, body?: unknown) {
  return new NextRequest(`http://localhost/api/${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
}
async function tenant() {
  const row = await prisma.tenant.create({
    data: { nome: 'Combined link test', slug: randomUUID() },
  })
  tenantIds.push(row.id)
  return row
}
async function user(tenantId: string, papel: 'AGENT' | 'OWNER' | 'PROPERTY_OWNER' | 'RENTER') {
  const row = await prisma.usuario.create({
    data: {
      tenantId,
      papel,
      nome: papel,
      email: `${randomUUID()}@link.test`,
      senhaHash: 'test',
    },
  })
  return { ...row, token: await tokens.sign(row) }
}
async function agency(renterEmail: string) {
  const agencyTenant = await tenant()
  const admin = await user(agencyTenant.id, 'OWNER')
  const agent = await user(agencyTenant.id, 'AGENT')
  const owner = await user(agencyTenant.id, 'OWNER')
  const propertyOwner = await user(agencyTenant.id, 'PROPERTY_OWNER')
  const property = await prisma.imovel.create({
    data: {
      tenantId: agencyTenant.id,
      responsavelId: agent.id,
      titulo: 'Property',
      finalidade: 'ALUGUEL',
      tipo: 'APARTAMENTO',
      valor: 1000,
    },
  })
  const opportunity = await prisma.oportunidade.create({
    data: {
      tenantId: agencyTenant.id,
      imovelId: property.id,
      responsavelId: await propertyResponsibleId(prisma, property.id),
      interessadoNome: 'Renter',
      interessadoEmail: renterEmail,
      valorProposto: 1000,
      status: 'ACEITA',
    },
  })
  const contract = await prisma.contrato.create({
    data: {
      tenantId: agencyTenant.id,
      imovelId: property.id,
      oportunidadeOrigemId: opportunity.id,
      codigo: randomUUID(),
      valor: 1000,
      diaVencimento: 5,
      dataInicio: new Date('2026-01-01'),
      dataFim: new Date('2027-01-01'),
      indiceReajuste: 'IPCA',
      tipoGarantia: 'CAUCAO',
      status: 'ATIVO',
      partes: {
        create: {
          papel: 'LOCATARIO',
          nome: 'Renter',
          cpf: '00000000000',
          email: renterEmail.toUpperCase(),
        },
      },
    },
    include: { partes: true },
  })
  const charge = await prisma.cobranca.create({
    data: {
      tenantId: agencyTenant.id,
      contratoId: contract.id,
      tipo: 'A_RECEBER',
      codigo: randomUUID(),
      valor: 1000,
      vencimento: new Date('2026-10-05'),
      status: 'PENDENTE',
    },
  })
  const ticket = await prisma.chamadoManutencao.create({
    data: {
      tenantId: agencyTenant.id,
      imovelId: property.id,
      contratoId: contract.id,
      abertoPorId: admin.id,
      abertoPorNome: admin.nome,
      titulo: 'Leak',
      descricao: 'Leak',
      categoria: 'PLUMBING',
    },
  })
  return {
    tenant: agencyTenant,
    admin,
    agent,
    owner,
    propertyOwner,
    property,
    contract,
    charge,
    ticket,
    party: contract.partes[0],
  }
}

describe('Contracts, financial and maintenance share explicit renter links', () => {
  let renter: Awaited<ReturnType<typeof user>>
  let unrelated: Awaited<ReturnType<typeof user>>
  let a: Awaited<ReturnType<typeof agency>>
  let b: Awaited<ReturnType<typeof agency>>

  beforeEach(async () => {
    vi.clearAllMocks()
    const shared = await tenant()
    renter = await user(shared.id, 'RENTER')
    unrelated = await user(shared.id, 'RENTER')
    a = await agency(renter.email)
    b = await agency(renter.email)
    upload.mockImplementation(async ({ tenantId }: { tenantId: string }) => ({
      url: `/api/maintenance/media/maintenance/${tenantId}/${randomUUID()}.png`,
      contentType: 'image/png',
    }))
    download.mockResolvedValue({ url: 'https://private.example.test/temporary-image' })
  })
  afterAll(async () => {
    // Fixtures only: agency tenants precede the shared user tenants during cleanup.
    for (const tenantId of [...tenantIds].reverse()) {
      await prisma.solicitacaoTrocaPrestador.deleteMany({ where: { chamado: { tenantId } } })
      await prisma.tenant.delete({ where: { id: tenantId } })
    }
    await prisma.$disconnect()
  })

  function confirm(
    path: ConfirmationPath,
    target = a,
    token = target.admin.token,
    candidate = renter,
    ownerId?: string,
  ) {
    if (path === 'contracts') {
      return confirmContract(
        request(`contracts/${target.contract.id}/parties/${target.party.id}/link-user`, token, {
          email: candidate.email,
        }),
        {
          params: Promise.resolve({ id: target.contract.id, partyId: target.party.id }),
        },
      )
    }
    return confirmMaintenance(
      request('maintenance/links', token, {
        contractId: target.contract.id,
        partyId: target.party.id,
        renterId: candidate.id,
        ...(ownerId ? { ownerId } : {}),
      }),
    )
  }
  const success = (path: ConfirmationPath) => (path === 'contracts' ? 200 : 204)
  async function expectAccess(target: typeof a, token: string, status: number) {
    expect(
      (
        await readCharge(
          request(`financial/charges/${target.charge.id}`, token),
          context(target.charge.id),
        )
      ).status,
    ).toBe(status)
    expect(
      (
        await readTicket(
          request(`maintenance/tickets/${target.ticket.id}`, token),
          context(target.ticket.id),
        )
      ).status,
    ).toBe(status)
  }

  it.each(paths)(
    'confirmation via %s grants both modules and keeps agencies isolated',
    async (path) => {
      await expectAccess(a, renter.token, 404)
      expect((await listCharges(request('financial/charges', renter.token))).status).toBe(200)
      expect(
        await (await listTickets(request('maintenance/tickets', renter.token))).json(),
      ).toMatchObject({ items: [], totalCount: 0 })
      expect((await confirm(path)).status).toBe(success(path))
      expect((await confirm(path)).status).toBe(success(path))
      const otherPath = path === 'contracts' ? 'maintenance' : 'contracts'
      expect((await confirm(otherPath, b)).status).toBe(success(otherPath))
      await expectAccess(a, renter.token, 200)
      await expectAccess(b, renter.token, 200)
      await expectAccess(a, unrelated.token, 404)
      await expectAccess(b, a.admin.token, 404)
      await expectAccess(a, b.admin.token, 404)
      for (const list of [
        listCharges(request('financial/charges', renter.token)),
        listTickets(request('maintenance/tickets', renter.token)),
      ]) {
        expect(await (await list).json()).toMatchObject({ totalCount: 2 })
      }
      const choices = await (await options(request('maintenance/options', renter.token))).json()
      expect(choices.contracts.map((c: { id: string }) => c.id).sort()).toEqual(
        [a.contract.id, b.contract.id].sort(),
      )
      expect(choices.users).toEqual([])
      const adminChoices = await (
        await options(request('maintenance/options', a.admin.token))
      ).json()
      expect(adminChoices.contracts.map((c: { id: string }) => c.id)).toEqual([a.contract.id])
      expect(adminChoices.users.map((u: { id: string }) => u.id)).toContain(renter.id)
      expect(adminChoices.users.map((u: { id: string }) => u.id)).not.toContain(unrelated.id)
    },
  )

  it.each(paths)(
    'the %s path cannot replace a link confirmed by the other module',
    async (path) => {
      const otherPath = path === 'contracts' ? 'maintenance' : 'contracts'
      expect((await confirm(otherPath)).status).toBe(success(otherPath))
      await prisma.usuario.update({
        where: { id: renter.id },
        data: { email: `${randomUUID()}@changed.test` },
      })
      const replacement = await user(renter.tenantId, 'RENTER')
      await prisma.usuario.update({ where: { id: replacement.id }, data: { email: renter.email } })
      const candidate = { ...replacement, email: renter.email }
      const auditCount = await prisma.atividadeChamadoManutencao.count({
        where: { chamadoId: a.ticket.id },
      })
      expect((await confirm(path, a, a.admin.token, candidate, a.propertyOwner.id)).status).toBe(
        409,
      )
      expect(
        (await prisma.parteContrato.findUniqueOrThrow({ where: { id: a.party.id } })).usuarioId,
      ).toBe(renter.id)
      expect(
        (await prisma.imovel.findUniqueOrThrow({ where: { id: a.property.id } })).proprietarioId,
      ).toBeNull()
      expect(
        await prisma.atividadeChamadoManutencao.count({ where: { chamadoId: a.ticket.id } }),
      ).toBe(auditCount)
      await expectAccess(a, renter.token, 200)
      await expectAccess(a, replacement.token, 404)
    },
  )

  it.each(paths)(
    '%s rejects wrong email, unrelated parties and non-locataire roles',
    async (path) => {
      expect((await confirm(path, a, a.admin.token, unrelated)).status).toBe(409)
      expect((await confirm(path, { ...a, party: b.party })).status).toBe(404)
      for (const papel of ['LOCADOR', 'FIADOR'] as const) {
        await prisma.parteContrato.update({ where: { id: a.party.id }, data: { papel } })
        expect((await confirm(path)).status).toBe(404)
      }
      expect(
        (await prisma.parteContrato.findUniqueOrThrow({ where: { id: a.party.id } })).usuarioId,
      ).toBeNull()
    },
  )

  it.each(paths)('%s accepts only the managers of the contract agency', async (path) => {
    for (const actor of [renter, a.agent, a.propertyOwner])
      expect((await confirm(path, a, actor.token)).status).toBe(403)
    expect((await confirm(path, a, b.admin.token)).status).toBe(path === 'contracts' ? 404 : 403)
    expect(
      (await prisma.parteContrato.findUniqueOrThrow({ where: { id: a.party.id } })).usuarioId,
    ).toBeNull()
    expect((await confirm(path, a, a.owner.token)).status).toBe(success(path))
    expect(
      (await prisma.parteContrato.findUniqueOrThrow({ where: { id: a.party.id } })).usuarioId,
    ).toBe(renter.id)
  })

  it.each(paths)(
    '%s rejects inactive and non-renter accounts without partial changes',
    async (path) => {
      for (const data of [{ ativo: false }, { ativo: true, papel: 'AGENT' as const }]) {
        await prisma.usuario.update({ where: { id: renter.id }, data })
        expect((await confirm(path, a, a.admin.token, renter, a.propertyOwner.id)).status).toBe(404)
        expect(
          (await prisma.imovel.findUniqueOrThrow({ where: { id: a.property.id } })).proprietarioId,
        ).toBeNull()
      }
    },
  )

  it('lets the property owner read only the contracts and charges of their properties', async () => {
    await prisma.imovel.update({
      where: { id: a.property.id },
      data: { proprietarioId: a.propertyOwner.id },
    })
    const token = a.propertyOwner.token
    const contracts = await (await listContracts(request('contracts', token))).json()
    expect(contracts.items.map((c: { id: string }) => c.id)).toEqual([a.contract.id])
    expect(
      (await readContract(request(`contracts/${a.contract.id}`, token), context(a.contract.id)))
        .status,
    ).toBe(200)
    const charges = await (await listCharges(request('financial/charges', token))).json()
    expect(charges.items.map((c: { id: string }) => c.id)).toEqual([a.charge.id])
    expect(
      (await readCharge(request(`financial/charges/${a.charge.id}`, token), context(a.charge.id)))
        .status,
    ).toBe(200)

    await prisma.imovel.update({ where: { id: a.property.id }, data: { proprietarioId: null } })
    expect(
      (await readCharge(request(`financial/charges/${a.charge.id}`, token), context(a.charge.id)))
        .status,
    ).toBe(404)
    expect(
      (await readContract(request(`contracts/${a.contract.id}`, token), context(a.contract.id)))
        .status,
    ).toBe(404)
  })

  it('creates, schedules, comments and uploads in the linked agency tenant, including private media', async () => {
    expect((await confirm('contracts')).status).toBe(200)
    const created = await createTicket(
      request('maintenance/tickets', renter.token, {
        contractId: a.contract.id,
        propertyId: a.property.id,
        title: 'New leak',
        description: 'Details',
        category: 'PLUMBING',
        priority: 'NORMAL',
      }),
    )
    expect(created.status).toBe(201)
    const ticket = (await created.json()).ticket
    expect(
      (await prisma.chamadoManutencao.findUniqueOrThrow({ where: { id: ticket.id } })).tenantId,
    ).toBe(a.tenant.id)
    const ctx = context(ticket.id)
    expect(
      (
        await actOnTicket(
          request(`maintenance/tickets/${ticket.id}/actions`, renter.token, {
            action: 'provider',
            provider: { name: 'Plumber' },
          }),
          ctx,
        )
      ).status,
    ).toBe(200)
    expect(
      (
        await actOnTicket(
          request(`maintenance/tickets/${ticket.id}/actions`, renter.token, {
            action: 'schedule',
            scheduledAt: '2026-10-24T14:00:00-03:00',
          }),
          ctx,
        )
      ).status,
    ).toBe(200)
    expect(
      (
        await addNote(
          request(`maintenance/tickets/${ticket.id}/notes`, renter.token, {
            message: 'Agreed date',
          }),
          ctx,
        )
      ).status,
    ).toBe(201)
    expect(
      (
        await readActivities(
          request(`maintenance/tickets/${ticket.id}/activities`, renter.token),
          ctx,
        )
      ).status,
    ).toBe(200)
    const form = new FormData()
    form.set('file', new File([new Uint8Array([1, 2, 3])], 'photo.png', { type: 'image/png' }))
    const attached = await uploadAttachment(
      new NextRequest('http://localhost/api/maintenance/upload', {
        method: 'POST',
        headers: { authorization: `Bearer ${renter.token}` },
        body: form,
      }),
      ctx,
    )
    expect(attached.status).toBe(201)
    expect(upload).toHaveBeenCalledWith(expect.objectContaining({ tenantId: a.tenant.id }))
    const url = (await attached.json()).attachment.url as string
    const mediaContext = {
      params: Promise.resolve({ key: url.replace('/api/maintenance/media/', '').split('/') }),
    }
    expect(
      (await readMedia(request(url.slice('/api/'.length), renter.token), mediaContext)).status,
    ).toBe(302)
    expect(download).toHaveBeenCalledTimes(1)
    for (const denied of [unrelated, b.admin]) {
      expect(
        (await readMedia(request(url.slice('/api/'.length), denied.token), mediaContext)).status,
      ).toBe(404)
    }
    expect(download).toHaveBeenCalledTimes(1)
    expect(
      (
        await createTicket(
          request('maintenance/tickets', unrelated.token, {
            contractId: a.contract.id,
            title: 'Denied',
            description: 'Denied',
            category: 'PLUMBING',
            priority: 'NORMAL',
          }),
        )
      ).status,
    ).toBe(404)
  })

  it('does not expose legacy tickets or inconsistent contract/property/tenant relationships', async () => {
    expect((await confirm('contracts')).status).toBe(200)
    for (const data of [
      { contratoId: null },
      { contratoId: a.contract.id, imovelId: b.property.id },
      { imovelId: a.property.id, tenantId: b.tenant.id },
    ]) {
      await prisma.chamadoManutencao.update({ where: { id: a.ticket.id }, data })
      expect(
        (
          await readTicket(
            request(`maintenance/tickets/${a.ticket.id}`, renter.token),
            context(a.ticket.id),
          )
        ).status,
      ).toBe(404)
      expect(
        await (await listTickets(request('maintenance/tickets', renter.token))).json(),
      ).toMatchObject({ items: [], totalCount: 0 })
    }
    await prisma.imovel.update({ where: { id: a.property.id }, data: { tenantId: b.tenant.id } })
    const choices = await (await options(request('maintenance/options', renter.token))).json()
    expect(choices.contracts).toEqual([])
    await prisma.imovel.update({ where: { id: a.property.id }, data: { tenantId: a.tenant.id } })
    await prisma.chamadoManutencao.update({
      where: { id: a.ticket.id },
      data: { tenantId: a.tenant.id, imovelId: a.property.id, contratoId: a.contract.id },
    })
  })

  it('revokes access when the linked account becomes inactive or changes role', async () => {
    expect((await confirm('maintenance')).status).toBe(204)
    for (const data of [{ ativo: false }, { ativo: true, papel: 'AGENT' as const }]) {
      await prisma.usuario.update({ where: { id: renter.id }, data })
      expect([401, 403, 404]).toContain(
        (
          await readTicket(
            request(`maintenance/tickets/${a.ticket.id}`, renter.token),
            context(a.ticket.id),
          )
        ).status,
      )
      expect([401, 403, 404]).toContain(
        (
          await readCharge(
            request(`financial/charges/${a.charge.id}`, renter.token),
            context(a.charge.id),
          )
        ).status,
      )
    }
  })

  it('handles simultaneous API confirmations without losing the link or returning a server error', async () => {
    const responses = await Promise.all([confirm('contracts'), confirm('maintenance')])
    expect([200, 409]).toContain(responses[0].status)
    expect([204, 409]).toContain(responses[1].status)
    expect(responses.some((r) => r.status === 200 || r.status === 204)).toBe(true)
    expect(
      (await prisma.parteContrato.findUniqueOrThrow({ where: { id: a.party.id } })).usuarioId,
    ).toBe(renter.id)
    await expectAccess(a, renter.token, 200)
  })

  it('the shared persistence guard accepts only one of two stale claims for different user IDs', async () => {
    const input = {
      tenantId: a.tenant.id,
      contractId: a.contract.id,
      partyId: a.party.id,
      email: renter.email,
    }
    const results = await Promise.all([
      linkContractPartyUser(prisma, { ...input, userId: renter.id }),
      linkContractPartyUser(prisma, { ...input, userId: unrelated.id }),
    ])
    expect(results.filter(Boolean)).toHaveLength(1)
    const winner = (await prisma.parteContrato.findUniqueOrThrow({ where: { id: a.party.id } }))
      .usuarioId
    expect(winner).toBe(results[0] ? renter.id : unrelated.id)
  })
})
