import type { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { getDatabaseUrl } from '../../src/server/db/database-url'
import type {
  MaintenanceFixtureInput,
  MaintenanceFixtureResult,
  MaintenanceEvidence,
} from '../types/maintenance-fixtures'
function isolated() {
  if (
    process.env.KETRIS_E2E_ISOLATED_DB !== '1' ||
    !['localhost', '127.0.0.1', '[::1]'].includes(new URL(getDatabaseUrl()).hostname)
  )
    throw new Error('Maintenance E2E exige banco local isolado.')
}
export async function seedMaintenanceFixtures(
  prisma: PrismaClient,
  { suffix, password }: MaintenanceFixtureInput,
): Promise<MaintenanceFixtureResult> {
  isolated()
  if (!/^[a-z0-9-]+$/.test(suffix)) throw new Error('Identificador inválido.')
  const tenant = await prisma.tenant.create({
    data: { nome: 'Maintenance E2E', slug: 'maintenance-e2e-' + suffix, accountType: 'AGENCY' },
  })
  const renters = await prisma.tenant.create({
    data: { nome: 'Locatários Maintenance E2E', slug: 'maintenance-e2e-renters-' + suffix },
  })
  const senhaHash = await bcrypt.hash(password, 10)
  const owner = await prisma.usuario.create({
    data: {
      tenantId: tenant.id,
      nome: 'Gestora Maintenance E2E',
      email: 'owner-' + suffix + '@maintenance.example.test',
      senhaHash,
      papel: 'OWNER',
      emailVerificadoEm: new Date(),
    },
  })
  const renter = await prisma.usuario.create({
    data: {
      tenantId: renters.id,
      nome: 'Locatário Maintenance E2E',
      email: 'renter-' + suffix + '@maintenance.example.test',
      senhaHash,
      papel: 'RENTER',
      emailVerificadoEm: new Date(),
    },
  })
  const property = await prisma.imovel.create({
    data: {
      tenantId: tenant.id,
      responsavelId: owner.id,
      titulo: 'Apartamento Maintenance E2E',
      finalidade: 'ALUGUEL',
      tipo: 'APARTAMENTO',
      valor: 2000,
    },
  })
  const opportunity = await prisma.oportunidade.create({
    data: {
      tenantId: tenant.id,
      imovelId: property.id,
      interessadoNome: renter.nome,
      interessadoEmail: renter.email,
      valorProposto: 2000,
      status: 'ACEITA',
    },
  })
  const contract = await prisma.contrato.create({
    data: {
      tenantId: tenant.id,
      imovelId: property.id,
      oportunidadeOrigemId: opportunity.id,
      codigo: 'MNT-E2E-001',
      valor: 2000,
      diaVencimento: 5,
      dataInicio: new Date('2026-01-01'),
      dataFim: new Date('2030-01-01'),
      indiceReajuste: 'IPCA',
      tipoGarantia: 'CAUCAO',
      status: 'ATIVO',
      partes: {
        create: {
          papel: 'LOCATARIO',
          nome: renter.nome,
          email: renter.email,
          cpf: '00000000000',
          usuarioId: renter.id,
        },
      },
    },
  })
  let ticketId = ''
  for (let index = 0; index < 6; index++) {
    const ticket = await prisma.chamadoManutencao.create({
      data: {
        tenantId: tenant.id,
        contratoId: contract.id,
        imovelId: property.id,
        categoria: 'PLUMBING',
        titulo: 'Chamado E2E ' + index,
        descricao: 'Vazamento na cozinha',
        abertoPorId: renter.id,
        abertoPorNome: renter.nome,
        prioridade: index === 0 ? 'URGENTE' : 'NORMAL',
      },
    })
    if (index === 0) ticketId = ticket.id
  }
  return {
    tenantIds: [tenant.id, renters.id],
    ownerEmail: owner.email,
    renterEmail: renter.email,
    ticketId,
    propertyTitle: property.titulo,
    contractCode: contract.codigo,
  }
}
export async function cleanupMaintenanceFixtures(prisma: PrismaClient, tenantIds: string[]) {
  isolated()
  await prisma.tenant.deleteMany({
    where: { id: { in: tenantIds }, slug: { startsWith: 'maintenance-e2e-' } },
  })
  return null
}
export async function readMaintenanceEvidence(
  prisma: PrismaClient,
  id: string,
): Promise<MaintenanceEvidence> {
  isolated()
  const ticket = await prisma.chamadoManutencao.findFirstOrThrow({
    where: { id, tenant: { slug: { startsWith: 'maintenance-e2e-' } } },
    include: { anexos: true, atividades: true },
  })
  return {
    providerName: ticket.prestadorNome,
    providerId: ticket.prestadorId,
    attachmentCount: ticket.anexos.length,
    uploadId: ticket.anexos[0]?.uploadId ?? null,
    status: ticket.status,
    actions: ticket.atividades.map((activity) => activity.systemAction),
  }
}
