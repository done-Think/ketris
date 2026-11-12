describe(
  'Imóveis: cadastro, publicação e inativação',
  {
    defaultCommandTimeout: 20000,
    pageLoadTimeout: 120000,
    responseTimeout: 120000,
    requestTimeout: 120000,
  },
  () => {
    const unique = Date.now()
    const email = `e2e-properties-${unique}@ketris.dev`
    const brokerEmail = `e2e-property-broker-${unique}@ketris.dev`
    const password = 'Property-E2E-password-123'
    const title = `Casa E2E ${unique}`
    let tenantId: string
    let contactId: string
    const contactName = `Proprietário CRM ${unique}`

    before(() => {
      cy.task('seedAuthUser', { email, password, tenantSlug: `e2e-properties-${unique}` }).then(
        (id) => {
          tenantId = id as string
          cy.task('seedUserInTenant', { tenantId, email: brokerEmail, password, role: 'AGENT' })
        },
      )
      cy.request('POST', '/api/auth/login', { email, password }).then(({ body }) => {
        cy.request({
          method: 'POST',
          url: '/api/crm/contacts',
          headers: { Authorization: `Bearer ${body.accessToken}` },
          body: { name: contactName, email: `owner-contact-${unique}@example.test`, type: 'OWNER' },
        }).then(({ body: created }) => {
          contactId = created.contact.id
        })
      })
    })
    after(() => {
      if (tenantId) cy.task('cleanupAuthUser', tenantId)
    })

    it('salva rascunho, publica no detalhe e inativa sem apagar o registro', () => {
      cy.intercept('POST', '**/api/auth/login').as('login')
      cy.intercept('GET', '**/api/auth/session').as('loginSession')
      cy.visit('/pt/login?callbackUrl=/dashboard/properties/new')
      cy.wait('@loginSession')
      cy.get('input[name="email"]').type(email)
      cy.get('input[name="password"]').type(password, { log: false })
      cy.contains('button', 'Entrar').click()
      cy.wait('@login', { timeout: 120000 }).its('response.statusCode').should('eq', 200)
      cy.location('pathname', { timeout: 120000 }).should('include', '/dashboard/properties/new')

      cy.intercept('POST', '**/api/properties').as('createProperty')
      cy.intercept('POST', '**/api/properties/*/publish').as('publishProperty')
      cy.intercept('DELETE', '**/api/properties/*').as('deactivateProperty')
      const mediaUrl = `/api/properties/media/properties/${tenantId}/e2e.png`
      cy.intercept('POST', '**/api/properties/media', {
        delay: 2000,
        statusCode: 201,
        body: { media: { url: mediaUrl, contentType: 'image/png' } },
      }).as('uploadMedia')
      cy.intercept('GET', `**${mediaUrl}`, {
        fixture: 'property.png',
        headers: { 'Content-Type': 'image/png' },
      })
      cy.get('input[name="title"]').should('have.value', '')
      cy.contains('button', 'Próximo').click()
      cy.contains('Informe o título do anúncio').should('be.visible')
      cy.contains('label', /^Proprietário$/)
        .invoke('attr', 'for')
        .then((id) => {
          cy.get(`[id="${id}"]`).type(`no-contact-${unique}`)
          cy.contains('Nenhum resultado.').should('be.visible')
          cy.get(`[id="${id}"]`).clear().type(contactName)
        })
      cy.contains('[role="option"]', contactName).click()
      cy.contains('label', 'Corretores com acesso')
        .invoke('attr', 'for')
        .then((id) => {
          cy.get(`[id="${id}"]`).click()
        })
      cy.contains('[role="option"]', 'Usuário E2E').click()
      cy.get('body').type('{esc}')
      cy.contains('Sem conta de acesso vinculada').should('be.visible')
      cy.get('input[name="title"]').type(title)
      cy.get('textarea[name="description"]').type(
        'Casa com jardim cadastrada pelo teste de ponta a ponta.',
      )
      cy.contains('button', 'Próximo').click()
      cy.get('input[name="street"]').type('Rua das Flores')
      cy.get('input[name="number"]').type('10')
      cy.get('input[name="neighborhood"]').type('Centro')
      cy.get('input[name="city"]').type('Curitiba')
      cy.get('input[name="state"]').type('PR')
      cy.get('input[name="zipCode"]').type('80000000')
      cy.contains('button', 'Próximo').click()
      cy.get('input[name="area"]').clear().type('80')
      cy.contains('button', 'Próximo').click()
      cy.get('input[type="file"]').selectFile(
        {
          contents: Cypress.Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=',
            'base64',
          ),
          fileName: 'property.png',
          mimeType: 'image/png',
        },
        { force: true },
      )
      cy.contains('button', 'Próximo').should('be.disabled')
      cy.wait('@uploadMedia')
      cy.get('img').filter('[src*="/api/properties/media/"]').should('exist')
      cy.contains('button', 'Próximo').click()
      cy.get('input[name="mainValue"]').clear().type('2500,50')
      cy.get('textarea[name="negotiationTerm"]').type('Caução de dois aluguéis')
      cy.contains('label', 'Exige caução').click()
      cy.contains('button', 'Próximo').click()
      cy.contains('button', 'Salvar rascunho').click()
      cy.wait('@createProperty').then(({ response }) => {
        expect(response?.statusCode).to.eq(201)
        expect(response?.body.property.status).to.eq('DRAFT')
        expect(response?.body.property.ownerContactId).to.eq(contactId)
        expect(response?.body.property.ownerContact.name).to.eq(contactName)
        expect(response?.body.property.ownerId).to.eq(null)
        expect(response?.body.property.brokerIds).to.have.length(1)
        expect(response?.body.property.values.price).to.eq(2500.5)
        expect(response?.body.property.listing.negotiationTerms).to.eq('Caução de dois aluguéis')
        expect(response?.body.property.listing.negotiationConditions).to.deep.eq([
          'REQUIRES_DEPOSIT',
        ])
        cy.location('pathname').should(
          'include',
          `/dashboard/properties/${response?.body.property.id}`,
        )
      })
      cy.contains(title).should('be.visible')
      cy.contains('button', /^Histórico$/).click()
      cy.contains('button', /^Imóvel cadastrado por/).click()
      cy.get('[role="dialog"]').within(() => {
        cy.contains('Detalhes da alteração').should('be.visible')
        cy.contains('Usuário E2E').should('be.visible')
        cy.contains(title).should('be.visible')
        cy.contains('Exige caução').scrollIntoView().should('be.visible')
        cy.contains('Corretores com acesso')
          .scrollIntoView()
          .parent()
          .should('contain.text', 'Usuário E2E')
        cy.contains('button', 'Fechar').click()
      })
      cy.contains('button', /^Publicar$/).click()
      cy.wait('@publishProperty').its('response.body.property.status').should('eq', 'PUBLISHED')
      cy.contains('Disponível').should('be.visible')
      cy.contains('Atualizações recentes').should('be.visible')
      cy.contains('button', /^Dados$/).click()
      cy.contains('button', 'Exibir todo histórico').should('not.exist')
      cy.contains('button', /^Histórico$/).click()
      cy.contains('button', 'Exibir todo histórico').click()
      cy.get('[role="dialog"]').within(() => {
        cy.get('article').should('have.length', 2)
        cy.get('aside').should('be.visible').and('contain.text', 'Linha do tempo')
        cy.contains('article', title).should('exist')
        cy.get('article').first().should('contain.text', 'Depois')
        cy.get('article').eq(1).scrollIntoView()
        cy.get('aside [aria-current="step"]').should('contain.text', 'Imóvel cadastrado')
        cy.get('article').first().scrollIntoView()
        cy.get('aside [aria-current="step"]').should('contain.text', 'Imóvel publicado')
        cy.screenshot('property-full-change-history', { capture: 'viewport' })
        cy.contains('button', 'Fechar').click()
      })
      cy.contains('button', /^Dados$/).click()
      cy.contains('button', 'Exibir todo histórico').should('not.exist')
      cy.contains('button', /^Inativar$/).click()
      cy.get('[role="dialog"]').within(() => {
        cy.contains('preservados').should('be.visible')
        cy.contains('button', 'Inativar').click()
      })
      cy.wait('@deactivateProperty').its('response.statusCode').should('eq', 204)
      cy.location('pathname', { timeout: 120000 }).should('match', /\/dashboard\/properties\/?$/)
      cy.get('input[placeholder="Buscar imóveis..."]').type(title)
      cy.contains(title).should('be.visible')
      cy.contains('Inativo').should('be.visible')
    })
  },
)
