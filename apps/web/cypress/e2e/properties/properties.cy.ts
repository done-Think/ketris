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
    const password = 'Property-E2E-password-123'
    const title = `Casa E2E ${unique}`
    let tenantId: string

    before(() => {
      cy.task('seedAuthUser', { email, password, tenantSlug: `e2e-properties-${unique}` }).then(
        (id) => {
          tenantId = id as string
        },
      )
    })
    after(() => {
      if (tenantId) cy.task('cleanupAuthUser', tenantId)
    })

    it('salva rascunho, publica no detalhe e inativa sem apagar o registro', () => {
      cy.intercept('POST', '**/api/auth/login').as('login')
      cy.visit('/pt/login?callbackUrl=/dashboard/properties/new')
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
      cy.get('input[name="negotiationTerm"]').type('Caução de dois aluguéis')
      cy.contains('button', 'Próximo').click()
      cy.contains('button', 'Salvar rascunho').click()
      cy.wait('@createProperty').then(({ response }) => {
        expect(response?.statusCode).to.eq(201)
        expect(response?.body.property.status).to.eq('DRAFT')
        expect(response?.body.property.valores.valor).to.eq(2500.5)
        cy.location('pathname').should(
          'include',
          `/dashboard/properties/${response?.body.property.id}`,
        )
      })
      cy.contains(title).should('be.visible')
      cy.contains('button', /^Publicar$/).click()
      cy.wait('@publishProperty').its('response.body.property.status').should('eq', 'PUBLISHED')
      cy.contains('Disponível').should('be.visible')
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
