describe('Criar administrador (rota separada e não documentada)', () => {
  const tenantSlug = `e2e-tenant-admin-${Date.now()}`
  const adminEmail = `e2e-admin-root-${Date.now()}@ketris.dev`
  const adminPassword = 'senha-correta-123'
  const agentEmail = `e2e-agent-root-${Date.now()}@ketris.dev`
  const agentPassword = 'senha-correta-123'
  let tenantId: string
  let adminToken: string
  let agentToken: string

  before(() => {
    cy.task('seedAuthUser', { email: adminEmail, password: adminPassword, tenantSlug })
      .then((id) => {
        tenantId = id as string
        return cy.task('seedUserInTenant', {
          tenantId,
          email: agentEmail,
          password: agentPassword,
          papel: 'AGENT',
        })
      })
      .then(() =>
        cy.request('POST', '/api/auth/login', { email: adminEmail, password: adminPassword }),
      )
      .then((response) => {
        adminToken = response.body.accessToken
        return cy.request('POST', '/api/auth/login', { email: agentEmail, password: agentPassword })
      })
      .then((response) => {
        agentToken = response.body.accessToken
      })
  })

  after(() => {
    cy.task('cleanupAuthUser', tenantId)
  })

  it('cria um administrador quando o ator é ADMIN', () => {
    const email = `e2e-novo-admin-${Date.now()}@ketris.dev`

    cy.request({
      method: 'POST',
      url: '/api/auth/admins',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { nome: 'Novo Admin E2E', email, password: 'senha-longa-123' },
    }).then((response) => {
      expect(response.status).to.eq(201)
      expect(response.body.user.papel).to.eq('ADMIN')
      expect(response.body.user).to.not.have.property('senhaHash')
    })
  })

  it('retorna 403 quando o ator não é ADMIN', () => {
    cy.request({
      method: 'POST',
      url: '/api/auth/admins',
      headers: { Authorization: `Bearer ${agentToken}` },
      body: { nome: 'X', email: `x-${Date.now()}@ketris.dev`, password: 'senha-longa-123' },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403)
      expect(response.body.error.code).to.eq('FORBIDDEN')
    })
  })

  it('a rota não aparece no contrato público do Swagger', () => {
    cy.request('/api/docs/openapi.json').then((response) => {
      expect(response.body.paths).to.not.have.property('/auth/admins')
    })
  })
})
