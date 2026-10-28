describe('Autenticação', () => {
  let tenantId: string | null = null

  after(() => {
    if (tenantId) cy.task('cleanupAuthUser', tenantId)
  })

  it('exibe a tela e valida os campos obrigatórios', () => {
    cy.visit('/login')
    cy.contains('Entrar na sua conta')
    cy.contains('button', 'Entrar').click()
    cy.contains('Informe seu e-mail')
    cy.contains('Informe sua senha')
  })

  const databaseTest =
    Cypress.env('DATABASE_AVAILABLE') || Cypress.env('AUTH_MAILBOX_ENABLED') ? it : it.skip

  databaseTest('autentica com uma fixture isolada e mantém a sessão no dashboard', () => {
    const suffix = Date.now() + '-' + Math.floor(Math.random() * 10000)
    const email = `login-ui-${suffix}@example.test`
    const password = 'local-login-fixture-123'
    cy.task<string>('seedAuthUser', { email, password, tenantSlug: `e2e-login-ui-${suffix}` }).then(
      (id) => {
        tenantId = id
      },
    )
    cy.visit('/pt/login')
    cy.get('input[name="email"]').type(email)
    cy.get('input[name="password"]').type(password, { log: false })
    cy.contains('button', 'Entrar').click()
    cy.location('pathname').should('eq', '/pt/dashboard')
    cy.get('main').should('be.visible')
    cy.request('/api/auth/session').then(({ body }) => {
      expect(body.tenantId).to.eq(tenantId)
      expect(body.role).to.eq('OWNER')
      expect(body.user.email).to.eq(email)
    })
  })
})
