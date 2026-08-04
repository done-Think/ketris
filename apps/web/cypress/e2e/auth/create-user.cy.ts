describe('Criar usuário (API)', () => {
  const tenantSlug = `e2e-tenant-${Date.now()}`
  const adminEmail = `e2e-admin-${Date.now()}@ketris.dev`
  const adminPassword = 'senha-correta-123'
  const corretorEmail = `e2e-corretor-${Date.now()}@ketris.dev`
  const corretorPassword = 'senha-correta-123'
  let tenantId: string
  let adminToken: string
  let corretorToken: string

  before(() => {
    cy.task('seedAuthUser', { email: adminEmail, password: adminPassword, tenantSlug })
      .then((id) => {
        tenantId = id as string
        return cy.task('seedUserInTenant', {
          tenantId,
          email: corretorEmail,
          password: corretorPassword,
          papel: 'CORRETOR',
        })
      })
      .then(() =>
        cy.request('POST', '/api/auth/login', { email: adminEmail, password: adminPassword }),
      )
      .then((response) => {
        adminToken = response.body.accessToken
        return cy.request('POST', '/api/auth/login', {
          email: corretorEmail,
          password: corretorPassword,
        })
      })
      .then((response) => {
        corretorToken = response.body.accessToken
      })
  })

  after(() => {
    cy.task('cleanupAuthUser', tenantId)
  })

  it('cria um usuário quando o ator é ADMIN', () => {
    const email = `e2e-novo-${Date.now()}@ketris.dev`

    cy.request({
      method: 'POST',
      url: '/api/auth/users',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { nome: 'Novo Corretor E2E', email, password: 'senha-longa-123' },
    }).then((response) => {
      expect(response.status).to.eq(201)
      expect(response.body.user.email).to.eq(email)
      expect(response.body.user.tenantId).to.eq(tenantId)
      expect(response.body.user).to.not.have.property('senhaHash')
    })
  })

  it('retorna 401 sem access token', () => {
    cy.request({
      method: 'POST',
      url: '/api/auth/users',
      body: { nome: 'X', email: `x-${Date.now()}@ketris.dev`, password: 'senha-longa-123' },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.error.code).to.eq('UNAUTHORIZED')
    })
  })

  it('retorna 403 quando o ator autenticado não é ADMIN', () => {
    cy.request({
      method: 'POST',
      url: '/api/auth/users',
      headers: { Authorization: `Bearer ${corretorToken}` },
      body: { nome: 'X', email: `x-${Date.now()}@ketris.dev`, password: 'senha-longa-123' },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403)
      expect(response.body.error.code).to.eq('FORBIDDEN')
    })
  })

  it('retorna 409 quando o e-mail já existe no tenant', () => {
    cy.request({
      method: 'POST',
      url: '/api/auth/users',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { nome: 'Duplicado', email: adminEmail, password: 'senha-longa-123' },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(409)
      expect(response.body.error.code).to.eq('EMAIL_ALREADY_IN_USE')
    })
  })

  it('publica o contrato do endpoint em /api/docs/openapi.json', () => {
    cy.request('/api/docs/openapi.json').then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.paths).to.have.property('/auth/users')
    })
  })
})
