describe('Plataforma — sessão e visão cross-tenant (UI)', () => {
  const adminEmail = `e2e-platform-admin-${Date.now()}@ketris.dev`
  const adminPassword = 'senha-correta-123'
  let adminId: string
  let tenantId: string

  before(() => {
    cy.task('seedPlatformAdmin', { email: adminEmail, password: adminPassword }).then((id) => {
      adminId = id as string
    })
  })

  after(() => {
    cy.task('cleanupPlatformAdmin', adminId)
    if (tenantId) {
      cy.task('cleanupAuthUser', tenantId)
    }
  })

  it('redireciona para /platform/login quando um visitante deslogado tenta acessar a área protegida', () => {
    cy.visit('/pt/platform')
    cy.location('pathname').should('eq', '/pt/platform/login')
  })

  it('permite que um administrador da plataforma entre e veja o overview', () => {
    cy.visit('/pt/platform/login')
    cy.get('input[name="email"]').type(adminEmail)
    cy.get('input[name="password"]').type(adminPassword)
    cy.get('button[type="submit"]').click()

    cy.location('pathname').should('eq', '/pt/platform')
    cy.contains('Visão geral da plataforma').should('be.visible')
    cy.contains('Tendências de crescimento').should('be.visible')
    cy.contains('Alertas do sistema').should('be.visible')
    cy.contains('Tenants recentes').should('be.visible')
    cy.get('a[aria-current="page"]').contains('Visão geral').should('be.visible')

    cy.contains('a', 'Tenants').click()
    cy.location('pathname').should('eq', '/pt/platform/tenants')
    cy.contains('h1', 'Tenants').should('be.visible')

    cy.contains('a', 'Sistema').click()
    cy.location('pathname').should('eq', '/pt/platform/system')
    cy.contains('h1', 'Saúde do Sistema').should('be.visible')
    cy.contains('a', 'Usuários').click()
    cy.location('pathname').should('eq', '/pt/platform/admins/new')

    const socioEmail = `e2e-platform-socio-${Date.now()}@ketris.dev`

    cy.get('input[name="nome"]').type('Sócio Ketris')
    cy.get('input[name="email"]').type(socioEmail)
    cy.get('input[name="password"]').type('senha-longa-123')
    cy.get('input[name="confirmarSenha"]').type('senha-longa-123')
    cy.get('button[type="submit"]').click()

    cy.contains(socioEmail).should('be.visible')
  })

  it('cria uma imobiliária e um administrador dentro dela', () => {
    const tenantSlug = `e2e-platform-tenant-${Date.now()}`
    const tenantAdminEmail = `e2e-platform-tenant-admin-${Date.now()}@ketris.dev`

    cy.visit('/pt/platform/login')
    cy.get('input[name="email"]').type(adminEmail)
    cy.get('input[name="password"]').type(adminPassword)
    cy.get('button[type="submit"]').click()
    cy.location('pathname').should('eq', '/pt/platform')

    cy.visit('/pt/platform/tenants/new')

    cy.get('input[name="nome"]').type('Imobiliária E2E')
    cy.get('input[name="slug"]').type(tenantSlug)
    cy.get('button[type="submit"]').click()

    cy.location('pathname')
      .should('match', /^\/pt\/platform\/tenants\/.+/)
      .then((pathname) => {
        tenantId = pathname.split('/').pop() as string
      })

    cy.contains('Novo administrador').should('be.visible')
    cy.get('input[name="nome"]').type('Admin da Imobiliária E2E')
    cy.get('input[name="email"]').type(tenantAdminEmail)
    cy.get('input[name="password"]').type('senha-longa-123')
    cy.get('input[name="confirmarSenha"]').type('senha-longa-123')
    cy.get('button[type="submit"]').click()

    cy.contains(tenantAdminEmail).should('be.visible')

    cy.reload()
    cy.contains(tenantAdminEmail).should('be.visible')
    cy.contains('ADMIN').should('be.visible')
  })
})
