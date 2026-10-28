import type { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { getDatabaseUrl } from '../../src/server/db/database-url'
import type { CrmEvidence, CrmFixtureInput, CrmFixtureResult } from '../types/crm-fixtures'
import { propertyResponsibleId } from '../../src/server/shared/tests/fixtures/property-responsible'

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
    data: { name: 'CRM E2E', slug: 'crm-e2e-' + suffix },
  })
  const foreignTenant = await prisma.tenant.create({
    data: { name: 'Outro CRM E2E', slug: 'crm-e2e-foreign-' + suffix },
  })
  const passwordHash = await bcrypt.hash(password, 10)
  const owner = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      name: 'Gestora CRM E2E',
      email: 'owner-' + suffix + '@crm.example.test',
      passwordHash,
      role: 'OWNER',
      emailVerifiedAt: new Date(),
    },
  })
  const agent = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      name: 'Corretor CRM E2E',
      email: 'agent-' + suffix + '@crm.example.test',
      passwordHash,
      role: 'AGENT',
      emailVerifiedAt: new Date(),
      membershipApprovedAt: new Date(),
    },
  })
  const foreign = await prisma.user.create({
    data: {
      tenantId: foreignTenant.id,
      name: 'Foreign CRM',
      email: 'foreign-' + suffix + '@crm.example.test',
      passwordHash,
      role: 'OWNER',
      emailVerifiedAt: new Date(),
    },
  })
  const property = await prisma.property.create({
    data: {
      tenantId: tenant.id,
      responsibleId: agent.id,
      title: 'Apartamento CRM não publicado',
      purpose: 'RENT',
      type: 'APARTMENT',
      price: 1800.45,
      status: 'DRAFT',
    },
  })
  const linkedProperty = await prisma.property.create({
    data: {
      tenantId: tenant.id,
      responsibleId: owner.id,
      title: 'Casa da gestão CRM',
      purpose: 'SALE',
      type: 'HOUSE',
      price: 500000,
      status: 'DRAFT',
    },
  })
  const foreignProperty = await prisma.property.create({
    data: {
      tenantId: foreignTenant.id,
      responsibleId: foreign.id,
      title: 'Imóvel de outro tenant',
      purpose: 'RENT',
      type: 'APARTMENT',
      price: 1800,
      status: 'PUBLISHED',
    },
  })
  const foreignOpportunity = await prisma.opportunity.create({
    data: {
      tenantId: foreignTenant.id,
      propertyId: foreignProperty.id,
      responsibleId: await propertyResponsibleId(prisma, foreignProperty.id),
      interestedName: 'Pessoa de outra imobiliária',
      interestedEmail: 'foreign-' + suffix + '@crm.test',
      proposedValue: 1800,
    },
  })
  let contactId: string | null = null,
    opportunityId: string | null = null,
    linkedOpportunityId: string | null = null
  const contactName = 'Contato CRM principal'
  if (!empty) {
    for (let index = 0; index < 7; index++) {
      const contact = await prisma.contact.create({
        data: {
          tenantId: tenant.id,
          createdById: owner.id,
          name: index === 0 ? contactName : 'Contato CRM ' + index,
          email: 'contact-' + index + '-' + suffix + '@crm.test',
          phone: '11999999999',
          type: 'RENTER',
        },
      })
      const opportunity = await prisma.opportunity.create({
        data: {
          tenantId: tenant.id,
          propertyId: property.id,
          responsibleId: await propertyResponsibleId(prisma, property.id),
          contactId: contact.id,
          interestedName: contact.name,
          interestedEmail: contact.email,
          interestedPhone: contact.phone,
          proposedValue: 1800.45,
          status: 'DRAFT',
          createdAt: new Date(Date.now() - index * 1000),
        },
      })
      if (index === 0) {
        contactId = contact.id
        opportunityId = opportunity.id
        linkedOpportunityId = (
          await prisma.opportunity.create({
            data: {
              tenantId: tenant.id,
              propertyId: linkedProperty.id,
              responsibleId: await propertyResponsibleId(prisma, linkedProperty.id),
              contactId: contact.id,
              interestedName: contact.name,
              interestedEmail: contact.email,
              interestedPhone: contact.phone,
              proposedValue: 500000,
              status: 'SENT',
            },
          })
        ).id
      }
    }
    for (let index = 0; index < 6; index++)
      await prisma.lead.create({
        data: {
          tenantId: tenant.id,
          responsibleId: agent.id,
          name: index === 5 ? 'Lead CRM Último' : 'Lead CRM ' + index,
          phone: '11999999999',
          email: 'lead-' + index + '-' + suffix + '@crm.test',
          interest: 'Apartamento',
          budget: 'A combinar',
          source: 'WEBSITE',
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
    propertyTitle: property.title,
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
  const contact = await prisma.contact.findFirst({ where: { id: contactId, tenantId } })
  const opportunities = await prisma.opportunity.findMany({
    where: { tenantId, contactId: contactId },
  })
  const audits = await prisma.crmAuditEvent.findMany({
    where: { tenantId, entityId: { in: [contactId, ...opportunities.map((item) => item.id)] } },
    select: { action: true, entityType: true, actorUserId: true, changedFields: true },
  })
  return {
    contact: contact ? { name: contact.name, email: contact.email, phone: contact.phone } : null,
    opportunities: opportunities.map((item) => ({
      id: item.id,
      leadName: item.interestedName,
      leadEmail: item.interestedEmail,
      specialConditions: item.specialConditions,
      notes: item.notes,
    })),
    audits,
  }
}
export async function cleanupCrmFixtures(prisma: PrismaClient, tenantIds: string[]): Promise<null> {
  for (const tenantId of tenantIds) {
    await assertFixtureTenant(prisma, tenantId)
    await prisma.opportunity.deleteMany({ where: { tenantId } })
    await prisma.property.deleteMany({ where: { tenantId } })
    await prisma.tenant.delete({ where: { id: tenantId } })
  }
  return null
}
