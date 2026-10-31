describe('Broker profile covering a broad region', () => {
  const suffix = Date.now()
  const email = `regional-broker-${suffix}@example.test`
  const password = 'Regional-broker-e2e-password-123'
  const displayName = `Corretora Regional ${suffix}`
  let tenantId: string
  let brokerId: string

  before(() => {
    cy.task<string>('seedAuthUser', {
      email: `regional-owner-${suffix}@example.test`,
      password,
      tenantSlug: `regional-broker-${suffix}`,
    }).then((id) => {
      tenantId = id
      return cy.task('seedUserInTenant', { tenantId, email, password, role: 'AGENT' })
    })
    cy.request({
      method: 'POST',
      url: '/api/auth/login',
      body: { email, password },
      log: false,
    }).then(({ body }) => {
      brokerId = body.user.id
      return cy.request({
        method: 'PUT',
        url: '/api/marketplace/profiles/broker',
        headers: { Authorization: `Bearer ${body.accessToken}` },
        log: false,
        body: {
          displayName,
          headline: 'Especialista em imóveis no Sul de Minas',
          bio: 'Atendimento em várias cidades da região.',
          creci: 'MG-12345-F',
          phone: '(35) 99999-0000',
          region: 'Itajubá',
          neighborhoods: ['Centro'],
          specialties: ['Residencial'],
          availability: 'Segunda a sexta',
          primaryColor: '#123456',
          secondaryColor: '#654321',
          backgroundColor: '#ffffff',
          avatarUrl: `/api/marketplace/media/profiles/brokers/${brokerId}/avatar.png`,
          bannerUrl: `/api/marketplace/media/profiles/brokers/${brokerId}/banner.png`,
        },
      })
    })
  })
  after(() => {
    if (tenantId) cy.task('cleanupAuthUser', tenantId)
  })

  it('clears neighborhoods and publishes the broader region without an empty public field', () => {
    cy.intercept('GET', '**/api/marketplace/media/profiles/brokers/**', {
      fixture: 'property.png',
      headers: { 'Content-Type': 'image/png' },
    })
    cy.visit('/pt/login?callbackUrl=/dashboard/public-profile')
    cy.get('input[name="email"]').type(email)
    cy.get('input[name="password"]').type(password, { log: false })
    cy.contains('button', 'Entrar').click()
    cy.location('pathname').should('eq', '/pt/dashboard/public-profile')
    cy.contains('button', /^Editar$/).click()
    cy.get('input[name="region"]').clear().type('Sul de Minas')
    cy.get('input[name="neighborhoods"]').should('have.value', 'Centro').clear()
    cy.contains('Opcional. Para áreas amplas').should('be.visible')
    cy.intercept('POST', '**/api/marketplace/profiles/broker/publish').as('publishBroker')
    cy.contains('button', /^Publicar$/).click()
    cy.wait('@publishBroker').then(({ response }) => {
      expect(response?.statusCode).to.eq(200)
      expect(response?.body.profile).to.include({ region: 'Sul de Minas', status: 'PUBLISHED' })
      expect(response?.body.profile.neighborhoods).to.deep.eq([])
    })
    cy.reload()
    cy.get('input[name="neighborhoods"]').should('have.value', '')
    cy.get('input[name="region"]').should('have.value', 'Sul de Minas')
    cy.visit(`/pt/corretores/${brokerId}`)
    cy.get('h1').should('contain', displayName)
    cy.get('main').should('contain', 'Sul de Minas')
    cy.get('main')
      .contains(/^Bairros$/)
      .should('not.exist')
  })
})
