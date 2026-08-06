describe('Backoffice — bootstrap do primeiro administrador de um tenant (UI)', () => {
  const bareTenantSlug = `e2e-bootstrap-${Date.now()}`
  let bareTenantId: string

  before(() => {
    cy.task('seedBareTenant', { tenantSlug: bareTenantSlug }).then((id) => {
      bareTenantId = id as string
    })
  })

  after(() => {
    cy.task('cleanupAuthUser', bareTenantId)
  })

  it('exibe um link para o setup a partir da tela de login', () => {
    cy.visit('/backoffice/login')
    cy.contains('a', 'Configurar primeiro acesso')
      .should('be.visible')
      .and('have.attr', 'href', '/backoffice/setup')
  })

  it('permite criar o primeiro admin de um tenant sem nenhum admin, sem exigir login', () => {
    const bootstrapEmail = `e2e-bootstrap-admin-${Date.now()}@ketris.dev`

    cy.visit('/backoffice/setup')
    cy.get('input[name="tenantSlug"]').type(bareTenantSlug)
    cy.get('input[name="nome"]').type('Primeiro Admin E2E')
    cy.get('input[name="email"]').type(bootstrapEmail)
    cy.get('input[name="password"]').type('senha-longa-123')
    cy.get('input[name="confirmarSenha"]').type('senha-longa-123')
    cy.get('button[type="submit"]').click()

    cy.location('pathname').should('eq', '/backoffice/login')

    cy.request('POST', '/api/auth/login', {
      email: bootstrapEmail,
      password: 'senha-longa-123',
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.user.papel).to.eq('ADMIN')
    })
  })

  it('bloqueia uma segunda tentativa de bootstrap no mesmo tenant', () => {
    cy.visit('/backoffice/setup')
    cy.get('input[name="tenantSlug"]').type(bareTenantSlug)
    cy.get('input[name="nome"]').type('Segundo Admin E2E')
    cy.get('input[name="email"]').type(`e2e-bootstrap-2-${Date.now()}@ketris.dev`)
    cy.get('input[name="password"]').type('senha-longa-123')
    cy.get('input[name="confirmarSenha"]').type('senha-longa-123')
    cy.get('button[type="submit"]').click()

    cy.contains('Este tenant já possui um administrador').should('be.visible')
    cy.location('pathname').should('eq', '/backoffice/setup')
  })
})
