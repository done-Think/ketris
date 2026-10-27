import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { PrismaActivityRepository } from '@server/crm/infrastructure/prisma-activity.repository'
import { prisma } from '@server/db/prisma'
import { NextRequest } from 'next/server'
import { randomUUID } from 'node:crypto'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { PATCH as editContact } from '../../contacts/[id]/route'
import { POST as createContact, GET as listContacts } from '../../contacts/route'
import { POST as convertLead } from '../../leads/[id]/convert/route'
import { PATCH as editLead } from '../../leads/[id]/route'
import { GET as listLeads } from '../../leads/route'
import {
  DELETE as deleteOpportunity,
  PATCH as editOpportunity,
} from '../../opportunities/[id]/route'
import { POST as createOpportunity, GET as listOpportunities } from '../../opportunities/route'
import { GET as getProperty } from '../../properties/[id]/route'
import { GET as listProperties } from '../../properties/route'

describe('CRM consistency, pagination and authorization', () => {
  const tenants: string[] = []
  let tenantId: string,
    otherTenantId: string,
    ownerId: string,
    agentId: string,
    otherAgentId: string
  let ownerToken: string,
    agentToken: string,
    otherAgentToken: string,
    propertyId: string,
    otherPropertyId: string,
    foreignPropertyId: string
  const tokenService = new JoseTokenService()
  const context = (id: string) => ({ params: Promise.resolve({ id }) })
  const request = (token: string, method: string, path: string, body?: unknown) =>
    new NextRequest('http://localhost/api/crm/' + path, {
      method,
      headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
  beforeAll(async () => {
    for (const name of ['CRM regressions', 'Foreign CRM']) {
      const tenant = await prisma.tenant.create({
        data: { nome: name, slug: 'crm-regressions-' + randomUUID() },
      })
      tenants.push(tenant.id)
    }
    ;[tenantId, otherTenantId] = tenants
    const user = (name: string, papel: 'OWNER' | 'AGENT', tenant = tenantId) =>
      prisma.usuario.create({
        data: {
          tenantId: tenant,
          nome: name,
          papel,
          email: randomUUID() + '@crm.test',
          senhaHash: 'not-used',
          emailVerificadoEm: new Date(),
          vinculoAprovadoEm: new Date(),
        },
      })
    const owner = await user('Gestora', 'OWNER'),
      agent = await user('Corretor José', 'AGENT'),
      otherAgent = await user('Outra corretora', 'AGENT'),
      foreign = await user('Foreign', 'OWNER', otherTenantId)
    ownerId = owner.id
    agentId = agent.id
    otherAgentId = otherAgent.id
    ownerToken = await tokenService.sign(owner)
    agentToken = await tokenService.sign(agent)
    otherAgentToken = await tokenService.sign(otherAgent)
    const property = (responsavelId: string, titulo: string, tenant = tenantId) =>
      prisma.imovel.create({
        data: {
          tenantId: tenant,
          responsavelId,
          titulo,
          finalidade: 'ALUGUEL',
          tipo: 'APARTAMENTO',
          valor: 1800.45,
          status: 'DRAFT',
        },
      })
    propertyId = (await property(agentId, 'Apartamento não publicado')).id
    otherPropertyId = (await property(otherAgentId, 'Casa de outra corretora')).id
    foreignPropertyId = (await property(foreign.id, 'Imóvel estrangeiro', otherTenantId)).id
  })
  afterEach(() => vi.restoreAllMocks())
  afterAll(async () => {
    await prisma.contrato.deleteMany({ where: { tenantId: { in: tenants } } })
    await prisma.oportunidade.deleteMany({ where: { tenantId: { in: tenants } } })
    await prisma.imovel.deleteMany({ where: { tenantId: { in: tenants } } })
    await prisma.tenant.deleteMany({ where: { id: { in: tenants } } })
    await prisma.$disconnect()
  })
  const payload = (extra = {}) => ({
    propertyId,
    leadName: 'Interessada',
    leadEmail: randomUUID() + '@crm.test',
    proposedValue: 1800.45,
    ...extra,
  })

  it('keeps agent-created contacts visible without granting access to another agent', async () => {
    const response = await createContact(
      request(agentToken, 'POST', 'contacts', {
        name: 'Contato próprio',
        email: randomUUID() + '@crm.test',
      }),
    )
    expect(response.status).toBe(201)
    const { contact } = await response.json()
    const own = await (
      await listContacts(request(agentToken, 'GET', 'contacts?q=Contato%20próprio'))
    ).json()
    expect(own.contacts.map((item: { id: string }) => item.id)).toContain(contact.id)
    const others = await (
      await listContacts(request(otherAgentToken, 'GET', 'contacts?q=Contato%20próprio'))
    ).json()
    expect(others.contacts).toEqual([])
    expect(
      (
        await editContact(
          request(otherAgentToken, 'PATCH', 'contacts/' + contact.id, { name: 'Denied' }),
          context(contact.id),
        )
      ).status,
    ).toBe(404)
    expect(
      (
        await editContact(
          request(agentToken, 'PATCH', 'contacts/' + contact.id, { name: 'Nome atualizado' }),
          context(contact.id),
        )
      ).status,
    ).toBe(200)
    const event = await prisma.crmAuditEvent.findFirst({
      where: { entityId: contact.id, action: 'CREATED' },
    })
    expect(event).toMatchObject({ tenantId, actorUserId: agentId, actorRole: 'AGENT' })
  })

  it('synchronizes contact details both ways, including across linked opportunities, without crossing tenants', async () => {
    const contact = await prisma.contato.create({
      data: { tenantId, nome: 'Original', email: randomUUID() + '@crm.test', tipo: 'LOCATARIO' },
    })
    const first = await (
      await createOpportunity(
        request(
          ownerToken,
          'POST',
          'opportunities',
          payload({ contactId: contact.id, responsibleId: agentId }),
        ),
      )
    ).json()
    const second = await (
      await createOpportunity(
        request(
          ownerToken,
          'POST',
          'opportunities',
          payload({ contactId: contact.id, propertyId: otherPropertyId }),
        ),
      )
    ).json()
    expect(first.opportunity.leadName).toBe('Original')
    await editContact(
      request(ownerToken, 'PATCH', 'contacts/' + contact.id, {
        name: 'Atualizado no contato',
        phone: '11988888888',
      }),
      context(contact.id),
    )
    expect(
      (await prisma.oportunidade.findUniqueOrThrow({ where: { id: first.opportunity.id } }))
        .interessadoNome,
    ).toBe('Atualizado no contato')
    const email = randomUUID() + '@crm.test'
    const response = await editOpportunity(
      request(ownerToken, 'PATCH', 'opportunities/' + first.opportunity.id, {
        leadEmail: email,
        leadPhone: null,
      }),
      context(first.opportunity.id),
    )
    expect(response.status).toBe(200)
    expect(await prisma.contato.findUniqueOrThrow({ where: { id: contact.id } })).toMatchObject({
      email,
      telefone: null,
    })
    expect(
      await prisma.oportunidade.findUniqueOrThrow({ where: { id: second.opportunity.id } }),
    ).toMatchObject({ interessadoEmail: email, interessadoTelefone: null })
    const foreign = await prisma.contato.create({
      data: {
        tenantId: otherTenantId,
        nome: 'Foreign',
        email: randomUUID() + '@crm.test',
        tipo: 'LOCATARIO',
      },
    })
    expect(
      (
        await editOpportunity(
          request(ownerToken, 'PATCH', 'opportunities/' + first.opportunity.id, {
            contactId: foreign.id,
          }),
          context(first.opportunity.id),
        )
      ).status,
    ).toBe(404)
    expect(
      (await prisma.oportunidade.findUniqueOrThrow({ where: { id: first.opportunity.id } }))
        .contatoId,
    ).toBe(contact.id)
  })

  it('rolls back the write and audit if activity insertion fails', async () => {
    const created = await (
      await createOpportunity(
        request(ownerToken, 'POST', 'opportunities', payload({ status: 'ENVIADA' })),
      )
    ).json()
    const id = created.opportunity.id
    const audits = await prisma.crmAuditEvent.count({ where: { entityId: id } })
    vi.spyOn(PrismaActivityRepository.prototype, 'create').mockRejectedValueOnce(
      new Error('Forced audit failure'),
    )
    const response = await editOpportunity(
      request(ownerToken, 'PATCH', 'opportunities/' + id, { status: 'ACEITA' }),
      context(id),
    )
    expect(response.status).toBe(500)
    expect((await prisma.oportunidade.findUniqueOrThrow({ where: { id } })).status).toBe('ENVIADA')
    expect(await prisma.crmAuditEvent.count({ where: { entityId: id } })).toBe(audits)
  })

  it('requires a real email and converts a lead exactly once under concurrent requests', async () => {
    const lead = await prisma.lead.create({
      data: {
        tenantId,
        responsavelId: agentId,
        nome: 'Sem e-mail',
        telefone: '11999999999',
        interesse: 'Apartamento',
        orcamento: 'A combinar',
        origem: 'SITE',
      },
    })
    const body = { propertyId, proposedValue: 1800.45 }
    expect(
      (
        await convertLead(
          request(agentToken, 'POST', 'leads/' + lead.id + '/convert', body),
          context(lead.id),
        )
      ).status,
    ).toBe(400)
    const email = randomUUID() + '@crm.test'
    const responses = await Promise.all(
      [1, 2].map(() =>
        convertLead(
          request(agentToken, 'POST', 'leads/' + lead.id + '/convert', { ...body, email }),
          context(lead.id),
        ),
      ),
    )
    expect(responses.map((response) => response.status).sort()).toEqual([200, 409])
    const saved = await prisma.lead.findUniqueOrThrow({
      where: { id: lead.id },
      include: { oportunidade: true },
    })
    expect(
      (
        await editLead(
          request(agentToken, 'PATCH', 'leads/' + lead.id, { stage: 'NOVO' }),
          context(lead.id),
        )
      ).status,
    ).toBe(409)
    expect(
      (
        await editLead(
          request(agentToken, 'PATCH', 'leads/' + lead.id, { notes: 'Retornar amanhã' }),
          context(lead.id),
        )
      ).status,
    ).toBe(200)
    expect(saved.email).toBe(email)
    expect(saved.oportunidade?.interessadoEmail).toBe(email)
    expect(saved.oportunidade?.valorProposto.toNumber()).toBe(1800.45)
    expect(
      await prisma.crmAuditEvent.count({ where: { entityId: lead.id, action: 'CONVERTED' } }),
    ).toBe(1)
  })

  it('paginates all authorized results and computes distinct property counts instead of opportunity counts', async () => {
    const contact = await prisma.contato.create({
      data: {
        tenantId,
        nome: 'José paginação',
        email: randomUUID() + '@crm.test',
        tipo: 'LOCATARIO',
      },
    })
    for (let index = 0; index < 7; index++)
      await createOpportunity(
        request(
          ownerToken,
          'POST',
          'opportunities',
          payload({ contactId: contact.id, responsibleId: agentId }),
        ),
      )
    await createOpportunity(
      request(
        ownerToken,
        'POST',
        'opportunities',
        payload({ contactId: contact.id, propertyId: otherPropertyId }),
      ),
    )
    const first = await (
      await listOpportunities(request(ownerToken, 'GET', 'opportunities?contactId=' + contact.id))
    ).json()
    expect(first.opportunities).toHaveLength(5)
    expect(first.pagination).toMatchObject({ pageSize: 5, pageCount: 2, totalCount: 8 })
    const second = await (
      await listOpportunities(
        request(ownerToken, 'GET', 'opportunities?contactId=' + contact.id + '&page=2'),
      )
    ).json()
    expect(second.opportunities).toHaveLength(3)
    expect(
      first.opportunities.some((item: { id: string }) =>
        second.opportunities.some((other: { id: string }) => other.id === item.id),
      ),
    ).toBe(false)
    const agent = await (
      await listOpportunities(request(agentToken, 'GET', 'opportunities?contactId=' + contact.id))
    ).json()
    expect(agent.pagination.totalCount).toBe(7)
    const ownerContacts = await (
      await listContacts(request(ownerToken, 'GET', 'contacts?q=Jose%20paginacao'))
    ).json()
    const agentContacts = await (
      await listContacts(request(agentToken, 'GET', 'contacts?q=Jose%20paginacao'))
    ).json()
    expect(ownerContacts.contacts[0].propertyCount).toBe(2)
    expect(agentContacts.contacts[0].propertyCount).toBe(1)
  })

  it('preserves free-text budgets while ordering and searching beyond page one', async () => {
    const suffix = randomUUID()
    for (let index = 0; index < 6; index++)
      await prisma.lead.create({
        data: {
          tenantId,
          responsavelId: agentId,
          nome: 'Busca ' + suffix + ' ' + index,
          telefone: '11999999999',
          interesse: 'Apartamento',
          orcamento: index === 5 ? 'Sob consulta' : 'R$ 1.2M',
          origem: 'SITE',
        },
      })
    const response = await (
      await listLeads(
        request(
          agentToken,
          'GET',
          'leads?q=' + encodeURIComponent(suffix) + '&sortBy=budget&sortDirection=asc',
        ),
      )
    ).json()
    expect(response.pagination.totalCount).toBe(6)
    expect(response.leads[0].budget).toBe('Sob consulta')
    expect(response.leads[0].responsibleName).toBe('Corretor José')
  })

  it('lists and reads only authorized properties, including unpublished properties', async () => {
    const response = await (await listProperties(request(agentToken, 'GET', 'properties'))).json()
    expect(response.properties.map((item: { id: string }) => item.id)).toEqual([propertyId])
    expect(response.properties[0].publishedAt).toBeNull()
    expect(
      (
        await getProperty(
          request(agentToken, 'GET', 'properties/' + otherPropertyId),
          context(otherPropertyId),
        )
      ).status,
    ).toBe(404)
    expect(
      (
        await getProperty(
          request(ownerToken, 'GET', 'properties/' + foreignPropertyId),
          context(foreignPropertyId),
        )
      ).status,
    ).toBe(404)
  })

  it('preserves creation terms and their text exactly and blocks permanent deletion with a contract', async () => {
    const conditions = ['Pets, mediante vistoria', 'Desconto no primeiro mês\nConferir na entrega']
    const created = await (
      await createOpportunity(
        request(
          ownerToken,
          'POST',
          'opportunities',
          payload({
            contractTermMonths: 30,
            desiredStartDate: '2030-01-01',
            guaranteeType: 'CAUCAO',
            specialConditions: conditions,
          }),
        ),
      )
    ).json()
    const opportunity = created.opportunity
    expect(opportunity.specialConditions).toEqual(conditions)
    expect(
      await prisma.crmAuditEvent.findFirst({
        where: { entityId: opportunity.id, action: 'CREATED' },
      }),
    ).toMatchObject({ actorUserId: ownerId })
    expect(opportunity.contractTermMonths).toBe(30)
    await prisma.contrato.create({
      data: {
        tenantId,
        imovelId: propertyId,
        oportunidadeOrigemId: opportunity.id,
        codigo: 'CRM-' + randomUUID(),
        valor: 1800.45,
        diaVencimento: 5,
        dataInicio: new Date('2030-01-01'),
        dataFim: new Date('2031-01-01'),
        indiceReajuste: 'IPCA',
        tipoGarantia: 'CAUCAO',
      },
    })
    const deletion = await deleteOpportunity(
      request(ownerToken, 'DELETE', 'opportunities/' + opportunity.id + '?permanent=true'),
      context(opportunity.id),
    )
    expect(deletion.status).toBe(409)
    expect(await prisma.oportunidade.findUnique({ where: { id: opportunity.id } })).not.toBeNull()
    expect(
      (
        await deleteOpportunity(
          request(ownerToken, 'DELETE', 'opportunities/' + opportunity.id),
          context(opportunity.id),
        )
      ).status,
    ).toBe(200)
  })
})
