import type { SessionCookieFixtures } from '../../types/session-cookies'

describe('English API contract and old tabs', { testIsolation: true }, () => {
  const baseUrl = Cypress.config('baseUrl')
  if (!baseUrl) throw new Error('The API contract tests require a base URL.')
  const sessionCookieOptions = {
    domain: new URL(baseUrl).hostname,
    path: '/',
    hostOnly: true,
    httpOnly: true,
    log: false,
  }
  const suffix = Date.now()
  const email = `contract-${suffix}@example.test`
  const password = 'Contract-e2e-password-123'
  let tenantId: string
  let accessToken: string
  let refreshToken: string
  before(() => {
    cy.task('seedAuthUser', { email, password, tenantSlug: `contract-${suffix}` }).then((id) => {
      tenantId = id as string
    })
    cy.request('POST', '/api/auth/login', { email, password }).then(({ body }) => {
      accessToken = body.accessToken
      refreshToken = body.refreshToken
    })
  })

  it('keeps a canonical session authenticated', () => {
    cy.task<SessionCookieFixtures>(
      'createSessionCookies',
      { tenantId, email, accessToken, refreshToken },
      { log: false },
    ).then(({ current }) => {
      cy.setCookie('next-auth.session-token', current, sessionCookieOptions)
      cy.intercept('GET', '/api/auth/session').as('currentSession')
      cy.visit('/pt/dashboard/properties')
      cy.wait('@currentSession').then(({ response }) => {
        expect(response?.statusCode).to.eq(200)
        expect(response?.body.scope).to.eq('tenant')
        expect(response?.body.user.email).to.eq(email)
        expect(response?.body.authUnavailable).to.eq(false)
      })
      cy.location('pathname', { timeout: 60000 }).should('eq', '/pt/dashboard/properties')
    })
  })

  it('requires login when only the retired cookie role is present', () => {
    cy.task<SessionCookieFixtures>(
      'createSessionCookies',
      { tenantId, email, accessToken, refreshToken },
      { log: false },
    ).then(({ retired }) => {
      cy.setCookie('next-auth.session-token', retired, sessionCookieOptions)
      cy.intercept('GET', '/api/auth/session').as('retiredSession')
      cy.visit('/pt/dashboard/properties')
      cy.wait('@retiredSession').then(({ response }) => {
        expect(response?.statusCode).to.eq(200)
        expect(response?.body.user.email).to.eq(email)
        expect(response?.body.scope).to.eq(undefined)
        expect(response?.body.role).to.eq(undefined)
        expect(response?.body.accessToken).to.eq(undefined)
        expect(response?.body.refreshToken).to.eq(undefined)
        expect(response?.body.authUnavailable).to.eq(false)
      })
      cy.location('pathname', { timeout: 60000 }).should('include', '/login')
      cy.get('input[name="email"]').should('be.visible')
    })
  })
  after(() => {
    if (tenantId) cy.task('cleanupAuthUser', tenantId)
  })

  it('rejects an old tab before writing and accepts the current English schema', () => {
    const title = `Contract property ${suffix}`
    cy.visit('/pt/login')
    cy.window().then(async (window) => {
      for (const version of [undefined, '2']) {
        const response = await window.fetch('/api/properties', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
            ...(version ? { 'X-Ketris-Api-Version': version } : {}),
          },
          body: JSON.stringify(
            version
              ? { title, purpose: 'SALE', type: 'HOUSE', price: 100000 }
              : { titulo: title, finalidade: 'VENDA', tipo: 'CASA', valor: 100000 },
          ),
        })
        expect(response.status).to.eq(409)
        expect((await response.json()).error.code).to.eq('CLIENT_UPDATE_REQUIRED')
      }
    })
    cy.request({
      url: `/api/properties?search=${encodeURIComponent(title)}`,
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .its('body.pagination.total')
      .should('eq', 0)
    cy.request({
      method: 'POST',
      url: '/api/properties',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: { title, purpose: 'SALE', type: 'HOUSE', price: 100000 },
    }).then(({ status, body, headers }) => {
      expect(status).to.eq(201)
      expect(headers['x-ketris-api-version']).to.eq('3')
      expect(String(headers.vary).toLowerCase()).to.include('x-ketris-api-version')
      expect(body.property).to.include({ title, purpose: 'SALE', type: 'HOUSE' })
      expect(body.property).not.to.have.any.keys('titulo', 'finalidade', 'tipo', 'valores')
    })
  })
})
