describe('Backoffice — listar, editar e desativar administradores (UI)', () => {
  const tenantSlug = `e2e-admin-crud-${Date.now()}`
  const actorEmail = `e2e-admin-crud-ator-${Date.now()}@ketris.dev`
  const actorPassword = 'senha-correta-123'
  const otherAdminEmail = `e2e-admin-crud-outro-${Date.now()}@ketris.dev`
  const otherAdminPassword = 'senha-correta-123'
  let tenantId: string

  before(() => {
    cy.task('seedAuthUser', { email: actorEmail, password: actorPassword, tenantSlug }).then(
      (id) => {
        tenantId = id as string
        return cy.task('seedUserInTenant', {
          tenantId,
          email: otherAdminEmail,
          password: otherAdminPassword,
          papel: 'ADMIN',
        })
      },
    )
  })

  after(() => {
    cy.task('cleanupAuthUser', tenantId)
  })

  function loginAsActor() {
    cy.visit('/backoffice/login')
    cy.get('input[name="email"]').type(actorEmail)
    cy.get('input[name="password"]').type(actorPassword)
    cy.get('button[type="submit"]').click()
    cy.location('pathname').should('eq', '/backoffice')
  }

  it('lista os administradores do tenant e impede a autodesativação', () => {
    loginAsActor()
    cy.visit('/backoffice/admins')

    cy.contains(actorEmail).should('be.visible')
    cy.contains(otherAdminEmail).should('be.visible')

    cy.contains('tr', actorEmail).within(() => {
      cy.contains('button', 'Desativar').should('be.disabled')
    })
  })

  it('edita nome e e-mail de outro administrador', () => {
    loginAsActor()
    cy.visit('/backoffice/admins')
    cy.contains('a', otherAdminEmail).click()

    cy.get('input[name="nome"]').clear().type('Outro Admin Editado')
    cy.get('button[type="submit"]').click()

    cy.contains('Administrador atualizado.').should('be.visible')
  })

  it('desativa outro administrador, que não consegue mais logar', () => {
    loginAsActor()
    cy.visit('/backoffice/admins')

    cy.contains('tr', otherAdminEmail).within(() => {
      cy.contains('button', 'Desativar').click()
    })
    cy.contains('Administrador desativado.').should('be.visible')

    cy.request({
      method: 'POST',
      url: '/api/auth/login',
      failOnStatusCode: false,
      body: { email: otherAdminEmail, password: otherAdminPassword },
    }).then((response) => {
      expect(response.status).to.eq(401)
    })
  })

  it('nunca aparece no contrato OpenAPI público (/api/docs/openapi.json)', () => {
    cy.request('/api/docs/openapi.json').then((response) => {
      expect(response.body.paths).to.not.have.property('/auth/admins')
      expect(response.body.paths).to.not.have.property('/auth/admins/{id}')
    })
  })
})
