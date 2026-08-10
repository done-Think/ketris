describe('CRUD de usuários (API)', () => {
  const tenantSlug = `e2e-tenant-crud-${Date.now()}`
  const adminEmail = `e2e-admin-crud-${Date.now()}@ketris.dev`
  const adminPassword = 'senha-correta-123'
  let tenantId: string
  let adminToken: string
  let targetId: string

  before(() => {
    cy.task('seedAuthUser', { email: adminEmail, password: adminPassword, tenantSlug })
      .then((id) => {
        tenantId = id as string
        return cy.request('POST', '/api/auth/login', { email: adminEmail, password: adminPassword })
      })
      .then((response) => {
        adminToken = response.body.accessToken
        return cy.request({
          method: 'POST',
          url: '/api/auth/users',
          headers: { Authorization: `Bearer ${adminToken}` },
          body: {
            nome: 'Alvo CRUD',
            email: `alvo-crud-${Date.now()}@ketris.dev`,
            password: 'senha-longa-123',
          },
        })
      })
      .then((response) => {
        targetId = response.body.user.id
      })
  })

  after(() => {
    cy.task('cleanupAuthUser', tenantId)
  })

  it('lista os usuários do tenant sem incluir administradores', () => {
    cy.request({
      method: 'GET',
      url: '/api/auth/users',
      headers: { Authorization: `Bearer ${adminToken}` },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.users.some((user: { id: string }) => user.id === targetId)).to.eq(true)
      expect(response.body.users.every((user: { papel: string }) => user.papel !== 'ADMIN')).to.eq(
        true,
      )
    })
  })

  it('consulta um usuário específico por id', () => {
    cy.request({
      method: 'GET',
      url: `/api/auth/users/${targetId}`,
      headers: { Authorization: `Bearer ${adminToken}` },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.user.id).to.eq(targetId)
    })
  })

  it('atualiza o papel de OWNER/AGENT, mas nunca aceita ADMIN', () => {
    cy.request({
      method: 'PATCH',
      url: `/api/auth/users/${targetId}`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { papel: 'OWNER' },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.user.papel).to.eq('OWNER')
    })

    cy.request({
      method: 'PATCH',
      url: `/api/auth/users/${targetId}`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { papel: 'ADMIN' },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
    })
  })

  it('desativa (soft delete) e o login passa a ser recusado', () => {
    const email = `desativar-e2e-${Date.now()}@ketris.dev`

    cy.request({
      method: 'POST',
      url: '/api/auth/users',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { nome: 'Será Desativado', email, password: 'senha-longa-123' },
    })
      .then((createResponse) => {
        const userId = createResponse.body.user.id

        return cy
          .request({
            method: 'DELETE',
            url: `/api/auth/users/${userId}`,
            headers: { Authorization: `Bearer ${adminToken}` },
          })
          .then((deleteResponse) => {
            expect(deleteResponse.status).to.eq(200)
            expect(deleteResponse.body.user.ativo).to.eq(false)
          })
      })
      .then(() =>
        cy.request({
          method: 'POST',
          url: '/api/auth/login',
          body: { email, password: 'senha-longa-123' },
          failOnStatusCode: false,
        }),
      )
      .then((loginResponse) => {
        expect(loginResponse.status).to.eq(401)
      })
  })
})
