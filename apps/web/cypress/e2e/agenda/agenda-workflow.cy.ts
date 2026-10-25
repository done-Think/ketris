import type { AgendaFixtureSeedResult, AgendaAuditResult } from '../../types/agenda-fixtures'

const password = 'agenda-e2e-password-123'
function nextDate(offset = 1) {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
function login(email: string) {
  cy.visit('/pt/login')
  cy.get('input[name="email"]').type(email)
  cy.get('input[name="password"]').type(password, { log: false })
  cy.get('button')
    .filter(':visible')
    .contains(/^Entrar$/)
    .click()
  cy.location('pathname', { timeout: 90000 }).should('not.include', '/login')
  cy.getCookie('next-auth.session-token', { log: false }).should('exist')
}
function newEvent() {
  cy.get('button').filter(':visible').contains('Novo Evento').click()
}
function schedule(title: string, date = nextDate(), time = '12:00') {
  cy.get('input[name="title"]').clear().type(title)
  cy.get('input[name="scheduledDate"]').clear().type(date)
  cy.get('input[name="scheduledTime"]').clear().type(time)
  cy.get('input[name="participant"]').type('Cliente E2E')
  cy.get('input[name="phone"]').type('11999999999')
}
function ownerRequest(fixtures: AgendaFixtureSeedResult, body: Record<string, unknown>) {
  return cy
    .request({
      method: 'POST',
      url: '/api/auth/login',
      body: { email: fixtures.ownerEmail, password },
      log: false,
    })
    .then(({ body: auth }) =>
      cy.request({
        method: 'POST',
        url: '/api/agenda/events',
        headers: { Authorization: `Bearer ${auth.accessToken}` },
        body,
        log: false,
      }),
    )
}

describe('Agenda — fluxo real e permissões', () => {
  let fixtures: AgendaFixtureSeedResult | undefined
  beforeEach(() => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    cy.task<AgendaFixtureSeedResult>(
      'seedAgendaFixtures',
      { suffix, password },
      { log: false },
    ).then((data) => {
      fixtures = data
    })
  })
  afterEach(() => {
    if (fixtures) cy.task('cleanupAgendaFixtures', fixtures.tenantIds, { log: false })
    fixtures = undefined
  })

  it('busca imóveis sob demanda e cria, edita e cancela com motivo e autoria reais', () => {
    const data = fixtures!
    let optionRequests = 0
    let eventId = ''
    cy.intercept('GET', '**/api/agenda/properties*', (request) => {
      optionRequests += 1
      if (request.query.search === 'Imóvel E2E 00') request.alias = 'propertySearch'
      else if (!request.query.search)
        request.alias = Number(request.query.page ?? 1) === 2 ? 'propertyPage2' : 'propertyPage1'
    })
    cy.intercept('POST', '**/api/agenda/events').as('create')
    cy.intercept('PATCH', '**/api/agenda/events/*').as('edit')
    cy.intercept('POST', '**/api/agenda/events/*/cancel').as('cancel')
    login(data.ownerEmail)
    cy.visit('/pt/dashboard/agenda')
    cy.get('button')
      .filter(':visible')
      .contains('Novo Evento')
      .should('be.visible')
      .then(() => expect(optionRequests).to.eq(0))
    newEvent()
    cy.wait('@propertyPage1').then(({ response }) => {
      expect(response?.body.items).to.have.length(25)
      expect(response?.body.total).to.eq(26)
      expect(Object.keys(response?.body.items[0]).sort()).to.deep.eq(['id', 'label'])
    })
    cy.contains('button', 'Carregar mais imóveis').click()
    cy.wait('@propertyPage2').its('response.body.items').should('have.length', 1)
    cy.get('input[name="propertyId"]').type('Imóvel E2E 00')
    cy.wait('@propertySearch').then(({ response }) => {
      expect(response?.body.items.map((item: { id: string }) => item.id)).to.deep.eq([
        data.propertyId,
      ])
    })
    cy.contains('[role="option"]', 'Imóvel E2E 00').click()
    schedule('Visita E2E Agenda')
    cy.get('input[name="kind"]').parent().find('[role="combobox"]').click()
    cy.contains('[role="option"]', /^Visita$/).click()
    cy.contains('button', 'Criar evento').click()
    cy.wait('@create').then(({ response }) => {
      expect(response?.statusCode).to.eq(201)
      eventId = response?.body.event.id
      expect(response?.body.event.createdBy).to.deep.eq({ name: data.ownerName, role: 'OWNER' })
    })
    cy.get('button').filter(':visible').contains('Visita E2E Agenda').click()
    cy.contains(`Marcado por gestor da imobiliária ${data.ownerName}`).should('be.visible')
    cy.contains('button', /^Editar$/).click()
    cy.get('input[name="title"]').clear().type('Visita E2E atualizada')
    cy.contains('button', /^Salvar$/).click()
    cy.wait('@edit').its('response.statusCode').should('eq', 200)
    cy.contains('button', /^Excluir$/).click()
    cy.get('[role="dialog"]')
      .filter(':visible')
      .last()
      .within(() => {
        cy.contains('button', /^Excluir$/).click()
        cy.contains('Informe o motivo do cancelamento').should('be.visible')
        cy.get('textarea[name="reason"]').type('Cliente solicitou cancelamento')
        cy.contains('button', /^Excluir$/).click()
      })
    cy.wait('@cancel').then(({ response }) => {
      expect(response?.statusCode).to.eq(200)
      expect(response?.body.event.status).to.eq('CANCELLED')
      expect(response?.body.event.cancelledById).to.eq(data.ownerId)
      expect(response?.body.event.cancellationReason).to.eq('Cliente solicitou cancelamento')
      expect(response?.body.event.cancelledAt).to.be.a('string')
    })
    cy.contains('button', 'Visita E2E atualizada').should('not.exist')
    cy.then(() => cy.task<AgendaAuditResult[]>('readAgendaAudit', eventId, { log: false })).then(
      (history) => {
        expect(history.map((entry) => entry.action)).to.deep.eq(['CREATED', 'UPDATED', 'CANCELLED'])
        expect(history.every((entry) => entry.actorUserId === data.ownerId)).to.eq(true)
      },
    )
  })

  it('o corretor consulta um evento coletivo sem poder editá-lo', () => {
    const data = fixtures!
    ownerRequest(data, {
      title: 'Reunião interna coletiva',
      kind: 'MEETING',
      internal: true,
      audience: 'ALL_AGENTS',
      start: new Date(`${nextDate()}T12:00:00`).toISOString(),
      durationMinutes: 60,
    })
      .its('status')
      .should('eq', 201)
    login(data.agentEmail)
    cy.visit('/pt/dashboard/agenda')
    cy.get('button').filter(':visible').contains('Reunião interna coletiva').click()
    cy.get('[role="dialog"]')
      .filter(':visible')
      .within(() => {
        cy.contains('Reunião interna coletiva').should('be.visible')
        cy.contains('button', /^Editar$/).should('not.exist')
        cy.contains('button', /^Excluir$/).should('not.exist')
      })
  })

  it('o locatário escolhe apenas seu imóvel contratado e recebe a visão reduzida dos demais eventos', () => {
    const data = fixtures!
    let linkedId = ''
    ownerRequest(data, {
      title: 'Vistoria vinculada ao locatário',
      kind: 'INSPECTION',
      propertyReference: 'Apartamento contratado',
      start: new Date(`${nextDate()}T15:00:00`).toISOString(),
      durationMinutes: 60,
      participantName: 'Contato privado',
      participantPhone: '11999999999',
      notes: 'Nota privada da imobiliária',
      ownerEmail: data.renterEmail,
    }).then(({ body }) => {
      linkedId = body.event.id
    })
    login(data.renterEmail)
    cy.visit('/pt/dashboard/agenda')
    cy.get('button').filter(':visible').contains('Vistoria vinculada ao locatário').click()
    cy.get('[role="dialog"]')
      .filter(':visible')
      .within(() => {
        cy.contains('button', /^Editar$/).should('not.exist')
        cy.contains('button', /^Excluir$/).should('not.exist')
        cy.contains('Nota privada da imobiliária').should('not.exist')
        cy.get('button[aria-label]').first().click()
      })
    cy.request({ url: '/api/auth/session', log: false })
      .then(({ body: session }) =>
        cy.request({
          url: `/api/agenda/events/${linkedId}`,
          headers: { Authorization: `Bearer ${session.accessToken}` },
          log: false,
        }),
      )
      .then(({ body }) => {
        expect(body.event).not.to.have.property('createdBy')
        expect(body.event).not.to.have.property('participantPhone')
        expect(body.event).not.to.have.property('notes')
        expect(body.event).not.to.have.property('tenantId')
      })
    newEvent()
    cy.get('input[name="propertyId"]').click()
    cy.contains('[role="option"]', 'Imóvel E2E 00').should('be.visible')
    cy.contains('[role="option"]', /^Outro$/).should('not.exist')
    cy.contains('[role="option"]', 'Imóvel E2E 00').click()
    schedule('Visita criada pelo locatário', nextDate(2))
    cy.intercept('POST', '**/api/agenda/events').as('createRenter')
    cy.contains('button', 'Criar evento').click()
    cy.wait('@createRenter').then(({ response }) => {
      expect(response?.statusCode).to.eq(201)
      expect(response?.body.event.tenantId).to.eq(data.tenantId)
      expect(response?.body.event.responsibleId).to.eq(data.renterId)
    })
    cy.get('button')
      .filter(':visible')
      .contains('Visita criada pelo locatário')
      .should('be.visible')
  })
})
