describe('Plataforma — sessões de platform admin e de ADMIN de tenant nunca se misturam (UI)', () => {
  const tenantSlug = `e2e-session-isolation-${Date.now()}`
  const tenantAdminEmail = `e2e-session-isolation-tenant-admin-${Date.now()}@ketris.dev`
  const tenantAdminPassword = 'senha-correta-123'
  const platformAdminEmail = `e2e-session-isolation-platform-admin-${Date.now()}@ketris.dev`
  const platformAdminPassword = 'senha-correta-123'
  let tenantId: string
  let platformAdminId: string

  before(() => {
    cy.task('seedAuthUser', {
      email: tenantAdminEmail,
      password: tenantAdminPassword,
      tenantSlug,
    }).then((id) => {
      tenantId = id as string
    })
    cy.task('seedPlatformAdmin', {
      email: platformAdminEmail,
      password: platformAdminPassword,
    }).then((id) => {
      platformAdminId = id as string
    })
  })

  after(() => {
    cy.task('cleanupAuthUser', tenantId)
    cy.task('cleanupPlatformAdmin', platformAdminId)
  })

  it('uma sessão de ADMIN de tenant não acessa /platform', () => {
    cy.visit('/backoffice/login')
    cy.get('input[name="email"]').type(tenantAdminEmail)
    cy.get('input[name="password"]').type(tenantAdminPassword)
    cy.get('button[type="submit"]').click()
    cy.location('pathname').should('eq', '/backoffice/admins/new')

    cy.visit('/platform')
    cy.location('pathname').should('eq', '/platform/login')
  })

  it('uma sessão de platform admin não acessa /backoffice/admins/new', () => {
    cy.visit('/platform/login')
    cy.get('input[name="email"]').type(platformAdminEmail)
    cy.get('input[name="password"]').type(platformAdminPassword)
    cy.get('button[type="submit"]').click()
    cy.location('pathname').should('eq', '/platform')

    cy.visit('/backoffice/admins/new')
    cy.location('pathname').should('eq', '/backoffice/login')
  })
})
