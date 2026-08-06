describe('Refresh token (API)', () => {
  const tenantSlug = `e2e-tenant-${Date.now()}`
  const email = `e2e-refresh-${Date.now()}@ketris.dev`
  const password = 'senha-correta-123'
  let tenantId: string

  before(() => {
    cy.task('seedAuthUser', { email, password, tenantSlug }).then((id) => {
      tenantId = id as string
    })
  })

  after(() => {
    cy.task('cleanupAuthUser', tenantId)
  })

  function login() {
    return cy.request('POST', '/api/auth/login', { email, password }).then((response) => {
      return response.body.refreshToken as string
    })
  }

  it('troca um refresh token válido por um novo access token e refresh token', () => {
    login().then((refreshToken) => {
      cy.request('POST', '/api/auth/refresh', { refreshToken }).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body.accessToken).to.be.a('string')
        expect(response.body.refreshToken).to.be.a('string')
        expect(response.body.refreshToken).to.not.eq(refreshToken)
      })
    })
  })

  it('rotação: o mesmo refresh token não pode ser usado duas vezes', () => {
    login().then((refreshToken) => {
      cy.request('POST', '/api/auth/refresh', { refreshToken }).then((primeira) => {
        expect(primeira.status).to.eq(200)
      })

      cy.request({
        method: 'POST',
        url: '/api/auth/refresh',
        body: { refreshToken },
        failOnStatusCode: false,
      }).then((segunda) => {
        expect(segunda.status).to.eq(401)
        expect(segunda.body.error.code).to.eq('INVALID_REFRESH_TOKEN')
      })
    })
  })

  it('retorna 401 para um refresh token inexistente', () => {
    cy.request({
      method: 'POST',
      url: '/api/auth/refresh',
      body: { refreshToken: 'nao-existe' },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.error.code).to.eq('INVALID_REFRESH_TOKEN')
    })
  })

  it('publica o contrato do endpoint em /api/docs/openapi.json', () => {
    cy.request('/api/docs/openapi.json').then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.paths).to.have.property('/auth/refresh')
    })
  })
})
