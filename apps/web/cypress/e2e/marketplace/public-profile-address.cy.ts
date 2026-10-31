describe('Custom public profile addresses', () => {
  const suffix = Date.now()
  const password = 'Public-address-e2e-password-123'
  const ownerEmail = `address-owner-${suffix}@example.test`
  const brokerEmail = `address-broker-${suffix}@example.test`
  const brokerHandle = `broker-${suffix}`
  const renamedBrokerHandle = `new-broker-${suffix}`
  const agencyHandle = `agency-${suffix}`
  let tenantId: string
  let brokerId: string
  let ownerToken: string
  let brokerToken: string

  before(() => {
    cy.task<string>('seedAuthUser', {
      email: ownerEmail,
      password,
      tenantSlug: `addresses-${suffix}`,
    }).then((id) => {
      tenantId = id
      return cy.task('seedUserInTenant', { tenantId, email: brokerEmail, password, role: 'AGENT' })
    })
    cy.request({
      method: 'POST',
      url: '/api/auth/login',
      body: { email: ownerEmail, password },
      log: false,
    }).then(({ body }) => {
      ownerToken = body.accessToken
    })
    cy.request({
      method: 'POST',
      url: '/api/auth/login',
      body: { email: brokerEmail, password },
      log: false,
    }).then(({ body }) => {
      brokerToken = body.accessToken
      brokerId = body.user.id
      return cy.request({
        method: 'PUT',
        url: '/api/marketplace/profiles/broker',
        headers: { Authorization: `Bearer ${brokerToken}` },
        log: false,
        body: {
          displayName: 'Public Address Broker',
          headline: 'Seu corretor no Sul de Minas',
          bio: 'Atendimento imobiliário para toda a região.',
          creci: 'MG-12345',
          phone: '35999991234',
          region: 'Sul de Minas',
          neighborhoods: ['Centro'],
          specialties: ['Residencial'],
          availability: 'Segunda a sexta',
          primaryColor: '#e50078',
          secondaryColor: '#222222',
          backgroundColor: '#f6f6f6',
          avatarUrl: `/api/marketplace/media/profiles/brokers/${brokerId}/avatar.png`,
          bannerUrl: `/api/marketplace/media/profiles/brokers/${brokerId}/banner.png`,
        },
      })
    })
    cy.then(() =>
      cy.request({
        method: 'PUT',
        url: '/api/marketplace/profiles/agency',
        headers: { Authorization: `Bearer ${ownerToken}` },
        log: false,
        body: {
          displayName: 'Public Address Agency',
          headline: 'Imóveis no Sul de Minas',
          summary: 'Imobiliária para atendimento em toda a região.',
          legalCreci: 'MG-54321-J',
          headquarters: 'Itajubá',
          address: 'Rua do Teste, 35, Itajubá, MG',
          phone: '3536221234',
          email: ownerEmail,
          coverage: ['Sul de Minas'],
          segments: ['Venda'],
          yearsInMarket: 1,
          primaryColor: '#e50078',
          secondaryColor: '#222222',
          backgroundColor: '#f6f6f6',
          logoUrl: `/api/marketplace/media/profiles/agencies/${tenantId}/logo.png`,
          bannerUrl: `/api/marketplace/media/profiles/agencies/${tenantId}/banner.png`,
          team: [],
        },
      }),
    )
  })
  beforeEach(() => {
    cy.intercept('GET', '**/api/marketplace/media/**', {
      fixture: 'property.png',
      headers: { 'Content-Type': 'image/png' },
    })
  })
  after(() => {
    if (tenantId) cy.task('cleanupAuthUser', tenantId)
  })

  function login(email: string, path: string) {
    cy.visit(`/pt/login?callbackUrl=${path}`)
    cy.get('input[name="email"]').type(email)
    cy.get('input[name="password"]').type(password, { log: false })
    cy.contains('button', /^Entrar$/).click()
    cy.location('pathname').should('eq', `/pt${path}`)
  }
  function setAddress(handle: string, kind: 'broker' | 'agency') {
    cy.contains('button', 'Personalizar endereço').click()
    cy.get('[role="dialog"] input').clear().type(handle).blur()
    cy.contains('Endereço disponível.').should('be.visible')
    cy.intercept('PUT', `**/api/marketplace/profiles/${kind}/address`).as('saveAddress')
    cy.contains('button', 'Salvar endereço').click()
    cy.wait('@saveAddress').its('response.statusCode').should('eq', 200)
    cy.get('[role="dialog"]').should('not.exist')
    cy.contains('a', `/@${handle}`).should('have.attr', 'href', `/@${handle}`)
    cy.contains('button', 'Visualizar').click()
    cy.get('[role="dialog"]').within(() => {
      cy.contains(`/@${handle}`)
        .scrollIntoView({ offset: { top: -100, left: 0 } })
        .should('be.visible')
      cy.contains('a', 'Abrir link próprio').should('have.attr', 'href', `/pt/@${handle}`)
    })
    cy.get('body').type('{esc}')
    cy.get('[role="dialog"]').should('not.exist')
  }
  function expectUnavailable(handle: string) {
    // HTML-only crawlers receive a non-streamed HTTP 404.
    cy.request({
      url: `/@${handle}`,
      headers: { 'User-Agent': 'Twitterbot' },
      failOnStatusCode: false,
    })
      .its('status')
      .should('eq', 404)
  }

  function publishProfile(kind: 'broker' | 'agency') {
    cy.contains('Publique o perfil para liberar seu link público').should('be.visible')
    cy.contains('button', 'Personalizar endereço').should('not.exist')
    cy.contains('button', 'Copiar link').should('not.exist')
    cy.contains('button', 'Visualizar').click()
    cy.get('[role="dialog"]').within(() => {
      cy.contains('Publique o perfil para liberar seu link público')
        .scrollIntoView({ offset: { top: -100, left: 0 } })
        .should('be.visible')
      cy.contains('a', 'Abrir link próprio').should('not.exist')
    })
    cy.get('body').type('{esc}')
    cy.intercept('POST', `**/api/marketplace/profiles/${kind}/publish`).as('publishProfile')
    cy.contains('button', /^Publicar$/).click()
    cy.wait('@publishProfile').its('response.statusCode').should('eq', 200)
    cy.contains('button', 'Personalizar endereço').should('be.visible')
  }

  it('publishes and renames a broker address, retires the old handle and preserves ID links', () => {
    login(brokerEmail, '/dashboard/public-profile')
    expectUnavailable(brokerHandle)
    publishProfile('broker')
    setAddress(brokerHandle, 'broker')
    cy.visit(`/@${brokerHandle}`)
    cy.location('pathname').should('eq', `/@${brokerHandle}`)
    cy.contains('Public Address Broker').should('be.visible')
    cy.get('link[rel="canonical"]').should(
      'have.attr',
      'href',
      `${Cypress.config('baseUrl')}/pt/@${brokerHandle}`,
    )
    cy.visit(`/pt/corretores/${brokerId}`)
    cy.location('pathname').should('eq', `/pt/@${brokerHandle}`)
    cy.visit('/pt/dashboard/public-profile')
    setAddress(renamedBrokerHandle, 'broker')
    expectUnavailable(brokerHandle)
    cy.visit(`/pt/corretores/${brokerId}`)
    cy.location('pathname').should('eq', `/pt/@${renamedBrokerHandle}`)
    cy.contains('Public Address Broker').should('be.visible')
    cy.then(() =>
      cy.request({
        method: 'POST',
        url: '/api/marketplace/profiles/broker/unpublish',
        headers: { Authorization: `Bearer ${brokerToken}` },
        log: false,
      }),
    )
    expectUnavailable(renamedBrokerHandle)
    cy.visit('/pt/dashboard/public-profile')
    publishProfile('broker')
    cy.contains('a', `/@${renamedBrokerHandle}`).should('be.visible')
  })

  it('uses the same namespace for agencies and supports renaming with an empty highlighted team', () => {
    login(ownerEmail, '/dashboard/public-profile/agency')
    expectUnavailable(agencyHandle)
    publishProfile('agency')
    cy.contains('button', 'Personalizar endereço').click()
    cy.get('[role="dialog"] input').clear().type(renamedBrokerHandle).blur()
    cy.contains('Este endereço já está em uso. Escolha outro nome.').should('be.visible')
    cy.contains('button', 'Salvar endereço').should('be.disabled')
    cy.contains('button', /^Cancelar$/).click()
    setAddress(agencyHandle, 'agency')
    cy.visit(`/@${agencyHandle}`)
    cy.location('pathname').should('eq', `/@${agencyHandle}`)
    cy.contains('Public Address Agency').should('be.visible')
    cy.visit(`/es/@${agencyHandle}`)
    cy.contains('Public Address Agency').should('be.visible')
    cy.visit('/pt/dashboard/public-profile/agency')
    setAddress(`new-${agencyHandle}`, 'agency')
    expectUnavailable(agencyHandle)
    cy.visit(`/pt/imobiliarias/public-address-agency/54321`)
    cy.location('pathname').should('eq', `/pt/@new-${agencyHandle}`)
    cy.contains('Public Address Agency').should('be.visible')
  })
})
