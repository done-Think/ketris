describe('Backoffice — sign in e sign up de administrador (UI)', () => {
  const tenantSlug = `e2e-backoffice-${Date.now()}`
  const adminEmail = `e2e-backoffice-admin-${Date.now()}@ketris.dev`
  const adminPassword = 'senha-correta-123'
  const agentEmail = `e2e-backoffice-agent-${Date.now()}@ketris.dev`
  const agentPassword = 'senha-correta-123'
  let tenantId: string

  before(() => {
    cy.task('seedAuthUser', { email: adminEmail, password: adminPassword, tenantSlug }).then(
      (id) => {
        tenantId = id as string
        return cy.task('seedUserInTenant', {
          tenantId,
          email: agentEmail,
          password: agentPassword,
          papel: 'AGENT',
        })
      },
    )
  })

  after(() => {
    cy.task('cleanupAuthUser', tenantId)
  })

  it('redireciona para /backoffice/login quando um visitante deslogado tenta acessar a área protegida', () => {
    cy.visit('/backoffice/admins/new')
    cy.location('pathname').should('eq', '/backoffice/login')
  })

  it('exibe um link para a tela de cadastro de administrador na tela de login', () => {
    cy.visit('/backoffice/login')
    cy.contains('a', 'Cadastrar novo administrador')
      .should('be.visible')
      .and('have.attr', 'href', '/backoffice/admins/new')
  })

  it('bloqueia o acesso de um usuário autenticado que não é ADMIN', () => {
    cy.visit('/backoffice/login')
    cy.get('input[name="email"]').type(agentEmail)
    cy.get('input[name="password"]').type(agentPassword)
    cy.get('button[type="submit"]').click()

    cy.contains('Acesso restrito a administradores.').should('be.visible')
    cy.location('pathname').should('eq', '/backoffice/login')
  })

  it('permite que um ADMIN entre e crie um novo administrador', () => {
    cy.visit('/backoffice/login')
    cy.get('input[name="email"]').type(adminEmail)
    cy.get('input[name="password"]').type(adminPassword)
    cy.get('button[type="submit"]').click()

    cy.location('pathname').should('eq', '/backoffice/admins/new')

    const newAdminEmail = `e2e-novo-admin-${Date.now()}@ketris.dev`

    cy.get('input[name="nome"]').type('Novo Admin E2E')
    cy.get('input[name="email"]').type(newAdminEmail)
    cy.get('input[name="password"]').type('senha-longa-123')
    cy.get('input[name="confirmarSenha"]').type('senha-longa-123')
    cy.get('button[type="submit"]').click()

    cy.contains(newAdminEmail).should('be.visible')

    cy.request('POST', '/api/auth/login', {
      email: newAdminEmail,
      password: 'senha-longa-123',
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.user.papel).to.eq('ADMIN')
    })
  })
})
