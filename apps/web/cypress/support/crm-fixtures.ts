import type { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { getDatabaseUrl } from '../../src/server/db/database-url'
import type { CrmEvidence, CrmFixtureInput, CrmFixtureResult } from '../types/crm-fixtures'

function assertLocalDatabase() {
  const url = new URL(getDatabaseUrl())
  if (
    !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
    process.env.KETRIS_E2E_ISOLATED_DB !== '1'
  )
    throw new Error('Fixtures de CRM exigem banco local isolado.')
}
async function assertFixtureTenant(prisma: PrismaClient, id: string) {
  assertLocalDatabase()
  const tenant = await prisma.tenant.findUnique({ where: { id }, select: { slug: true } })
  if (!tenant?.slug.startsWith('crm-e2e-'))
    throw new Error('Tenant não pertence às fixtures de CRM.')
}
export async function seedCrmFixtures(
  prisma: PrismaClient,
  { suffix, password, empty }: CrmFixtureInput,
): Promise<CrmFixtureResult> {
  assertLocalDatabase()
  if (!/^[a-z0-9-]+$/.test(suffix)) throw new Error('Identificador de fixture inválido.')
  const tenant = await prisma.tenant.create({
    data: { nome: 'CRM E2E', slug: 'crm-e2e-' + suffix },
  })
  const foreignTenant = await prisma.tenant.create({
    data: { nome: 'Outro CRM E2E', slug: 'crm-e2e-foreign-' + suffix },
  })
  const senhaHash = await bcrypt.hash(password, 10)
  const owner = await prisma.usuario.create({
    data: {
      tenantId: tenant.id,
      nome: 'Gestora CRM E2E',
      email: 'owner-' + suffix + '@crm.example.test',
      senhaHash,
      papel: 'OWNER',
      emailVerificadoEm: new Date(),
    },
  })
  const agent = await prisma.usuario.create({
    data: {
      tenantId: tenant.id,
      nome: 'Corretor CRM E2E',
      email: 'agent-' + suffix + '@crm.example.test',
      senhaHash,
      papel: 'AGENT',
      emailVerificadoEm: new Date(),
      vinculoAprovadoEm: new Date(),
    },
  })
  const foreign = await prisma.usuario.create({
    data: {
      tenantId: foreignTenant.id,
      nome: 'Foreign CRM',
      email: 'foreign-' + suffix + '@crm.example.test',
      senhaHash,
      papel: 'OWNER',
      emailVerificadoEm: new Date(),
    },
  })
  const property = await prisma.imovel.create({
    data: {
      tenantId: tenant.id,
      responsavelId: agent.id,
      titulo: 'Apartamento CRM não publicado',
      finalidade: 'ALUGUEL',
      tipo: 'APARTAMENTO',
      valor: 1800.45,
      status: 'DRAFT',
    },
  })
  const linkedProperty = await prisma.imovel.create({
    data: {
      tenantId: tenant.id,
      responsavelId: owner.id,
      titulo: 'Casa da gestão CRM',
      finalidade: 'VENDA',
      tipo: 'CASA',
      valor: 500000,
      status: 'DRAFT',
    },
  })
  const foreignProperty = await prisma.imovel.create({
    data: {
      tenantId: foreignTenant.id,
      responsavelId: foreign.id,
      titulo: 'Imóvel de outro tenant',
      finalidade: 'ALUGUEL',
      tipo: 'APARTAMENTO',
      valor: 1800,
      status: 'PUBLISHED',
    },
  })
  const foreignOpportunity = await prisma.oportunidade.create({
    data: {
      tenantId: foreignTenant.id,
      imovelId: foreignProperty.id,
      interessadoNome: 'Pessoa de outra imobiliária',
      interessadoEmail: 'foreign-' + suffix + '@crm.test',
      valorProposto: 1800,
    },
  })
  let contactId: string | null = null,
    opportunityId: string | null = null,
    linkedOpportunityId: string | null = null
  const contactName = 'Contato CRM principal'
  if (!empty) {
    for (let index = 0; index < 7; index++) {
      const contact = await prisma.contato.create({
        data: {
          tenantId: tenant.id,
          createdById: owner.id,
          nome: index === 0 ? contactName : 'Contato CRM ' + index,
          email: 'contact-' + index + '-' + suffix + '@crm.test',
          telefone: '11999999999',
          tipo: 'LOCATARIO',
        },
      })
      const opportunity = await prisma.oportunidade.create({
        data: {
          tenantId: tenant.id,
          imovelId: property.id,
          contatoId: contact.id,
          interessadoNome: contact.nome,
          interessadoEmail: contact.email,
          interessadoTelefone: contact.telefone,
          valorProposto: 1800.45,
          status: 'RASCUNHO',
          createdAt: new Date(Date.now() - index * 1000),
        },
      })
      if (index === 0) {
        contactId = contact.id
        opportunityId = opportunity.id
        linkedOpportunityId = (
          await prisma.oportunidade.create({
            data: {
              tenantId: tenant.id,
              imovelId: linkedProperty.id,
              contatoId: contact.id,
              interessadoNome: contact.nome,
              interessadoEmail: contact.email,
              interessadoTelefone: contact.telefone,
              valorProposto: 500000,
              status: 'ENVIADA',
            },
          })
        ).id
      }
    }
    for (let index = 0; index < 6; index++)
      await prisma.lead.create({
        data: {
          tenantId: tenant.id,
          responsavelId: agent.id,
          nome: index === 5 ? 'Lead CRM Último' : 'Lead CRM ' + index,
          telefone: '11999999999',
          email: 'lead-' + index + '-' + suffix + '@crm.test',
          interesse: 'Apartamento',
          orcamento: 'A combinar',
          origem: 'Site',
          createdAt: new Date(Date.now() - index * 1000),
        },
      })
  }
  return {
    tenantId: tenant.id,
    foreignTenantId: foreignTenant.id,
    ownerEmail: owner.email,
    agentEmail: agent.email,
    propertyId: property.id,
    propertyTitle: property.titulo,
    contactId,
    contactName,
    opportunityId,
    linkedOpportunityId,
    foreignOpportunityId: foreignOpportunity.id,
  }
}
export async function readCrmEvidence(
  prisma: PrismaClient,
  { tenantId, contactId }: { tenantId: string; contactId: string },
): Promise<CrmEvidence> {
  await assertFixtureTenant(prisma, tenantId)
  const contact = await prisma.contato.findFirst({ where: { id: contactId, tenantId } })
  const opportunities = await prisma.oportunidade.findMany({
    where: { tenantId, contatoId: contactId },
  })
  const audits = await prisma.crmAuditEvent.findMany({
    where: { tenantId, entityId: { in: [contactId, ...opportunities.map((item) => item.id)] } },
    select: { action: true, entityType: true, actorUserId: true, changedFields: true },
  })
  return {
    contact: contact ? { name: contact.nome, email: contact.email, phone: contact.telefone } : null,
    opportunities: opportunities.map((item) => ({
      id: item.id,
      leadName: item.interessadoNome,
      leadEmail: item.interessadoEmail,
      specialConditions: item.condicoesEspeciais,
      notes: item.observacoes,
    })),
    audits,
  }
}
export async function cleanupCrmFixtures(prisma: PrismaClient, tenantIds: string[]): Promise<null> {
  for (const tenantId of tenantIds) {
    await assertFixtureTenant(prisma, tenantId)
    await prisma.oportunidade.deleteMany({ where: { tenantId } })
    await prisma.imovel.deleteMany({ where: { tenantId } })
    await prisma.tenant.delete({ where: { id: tenantId } })
  }
  return null
}
