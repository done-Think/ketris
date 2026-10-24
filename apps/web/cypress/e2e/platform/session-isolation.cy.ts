describe('Plataforma — sessões de platform admin e do dono da imobiliária nunca se misturam (UI)', () => {
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

  it('uma sessão do dono da imobiliária não acessa /platform', () => {
    cy.visit('/pt/login')
    cy.get('input[name="email"]').type(tenantAdminEmail)
    cy.get('input[name="password"]').type(tenantAdminPassword)
    cy.get('button[type="submit"]').click()
    cy.location('pathname').should('eq', '/pt/dashboard')

    cy.visit('/pt/platform')
    cy.location('pathname').should('eq', '/pt/platform/login')
  })
})
