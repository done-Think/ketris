import type { MaintenanceTicketStatus } from '@server/maintenance/types/maintenance-ticket'
import { randomUUID } from 'node:crypto'
import { NextRequest } from 'next/server'
import { afterAll, beforeAll, expect, vi } from 'vitest'
import type { UploadMaintenanceAttachmentInput } from '@server/maintenance/application/ports/maintenance-attachment-storage.port'
import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { prisma } from '@server/db/prisma'
import type { Papel } from '@server/auth/domain/user.entity'
import { POST } from '../../tickets/route'
import { POST as act } from '../../tickets/[id]/actions/route'

const { uploadToStorage } = vi.hoisted(() => ({ uploadToStorage: vi.fn() }))
// Only uploads are stubbed; downloads keep the real adapter over the mocked S3 client.
vi.mock(
  '@server/maintenance/infrastructure/s3-maintenance-attachment-storage',
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import('@server/maintenance/infrastructure/s3-maintenance-attachment-storage')
      >()
    return {
      S3MaintenanceAttachmentStorage: class extends actual.S3MaintenanceAttachmentStorage {
        override upload = uploadToStorage
      },
    }
  },
)
export function setupMaintenanceIntegration() {
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
    const admin = await user('OWNER'),
      agent = await user('AGENT'),
      owner = await user('PROPERTY_OWNER'),
      renter = await user('RENTER'),
      unrelated = await user('RENTER'),
      unrelatedOwner = await user('PROPERTY_OWNER'),
      unrelatedAgent = await user('AGENT')
    const property = await prisma.imovel.create({
      data: {
        tenantId: tenant.id,
        responsavelId: agent.id,
        proprietarioId: owner.id,
        titulo: 'Test Property',
        finalidade: 'ALUGUEL',
        tipo: 'APARTAMENTO',
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
      // Ticket authors are Restrict FKs, so tickets (and their cascaded rows) go before users.
      await prisma.chamadoManutencao.deleteMany({ where: { tenantId } })
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
    category: 'PLUMBING',
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
  async function legacyTicket(status: MaintenanceTicketStatus = 'FECHADO', archived = false) {
    return prisma.chamadoManutencao.create({
      data: {
        tenantId: fixture.tenant.id,
        imovelId: fixture.property.id,
        categoria: 'PLUMBING',
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
  return {
    legacyTicket,
    anotherContract,
    get fixture() {
      return fixture
    },
    get other() {
      return other
    },
    request,
    context,
    payload,
    create,
    action,
    attachmentRequest,
    uploadToStorage,
  }
}
