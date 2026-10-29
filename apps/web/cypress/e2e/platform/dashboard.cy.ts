const password = 'senha-correta-123'
const stamp = `${Date.now()}-${Math.floor(Math.random() * 10000)}`
const adminEmail = `e2e-platform-admin-${stamp}@ketris.dev`
const agentEmail = `e2e-platform-agent-${stamp}@ketris.dev`
const socioEmail = `e2e-platform-socio-${stamp}@ketris.dev`
const tenantSlug = `e2e-platform-tenant-${stamp}`
const tenantAdminEmail = `e2e-platform-owner-${stamp}@ketris.dev`
const adminIds: string[] = []

function signIn(email: string) {
  cy.visit('/pt/platform/login')
  cy.get('input[name="email"]').type(email)
  cy.get('input[name="password"]').type(password, { log: false })
  cy.get('button[type="submit"]').click()
  cy.location('pathname', { timeout: 60000 }).should('eq', '/pt/platform')
}

function dialog() {
  return cy.get('[role="dialog"]').filter(':visible').last()
}

describe('Plataforma — sessão, contas e administradores (UI)', () => {
  before(() => {
    for (const [email, role] of [
      [adminEmail, 'ADMIN'],
      [agentEmail, 'AGENT'],
    ] as const)
      cy.task<string>('seedPlatformAdmin', { email, password, role }).then((id) => {
        adminIds.push(id)
      })
  })

  after(() => {
    cy.task('cleanupTenantsBySlug', [tenantSlug])
    cy.task('cleanupPlatformAdminsByEmail', [socioEmail])
    for (const id of adminIds) cy.task('cleanupPlatformAdmin', id)
  })

  it('redireciona o visitante deslogado para o login da plataforma', () => {
    cy.visit('/pt/platform')
    cy.location('pathname').should('eq', '/pt/platform/login')
    cy.get('input[name="email"]').should('have.value', '')
  })

  it('mostra o overview real e navega pelas áreas da plataforma', () => {
    signIn(adminEmail)
    cy.contains('h1', 'Visão geral da plataforma').should('be.visible')
    cy.contains('Tendências de crescimento').should('be.visible')
    cy.contains('UTC ao vivo').should('be.visible')
    cy.contains('Alertas do sistema').should('not.exist')

    cy.contains('a', 'Tenants').click()
    cy.location('pathname').should('eq', '/pt/platform/tenants')
    cy.contains('h1', 'Tenants').should('be.visible')

    cy.contains('a', 'Sistema').click()
    cy.location('pathname').should('eq', '/pt/platform/system')
    cy.contains('h1', 'Saúde do Sistema').should('be.visible')

    cy.contains('a', 'Usuários').click()
    cy.location('pathname').should('eq', '/pt/platform/admins')
    cy.contains('tr', adminEmail).should('contain', 'Admin')
  })

  it('cria um platform admin pelo diálogo e registra o último acesso de quem entrou', () => {
    signIn(adminEmail)
    cy.visit('/pt/platform/admins')
    cy.contains('tr', adminEmail).should('not.contain', 'Nunca acessou')
    cy.contains('button', 'Novo administrador').click()
    dialog().find('input[name="name"]').type('Sócio Ketris')
    dialog().find('input[name="email"]').type(socioEmail)
    dialog().find('input[name="password"]').type('senha-longa-123')
    dialog().find('input[name="confirmPassword"]').type('senha-longa-123')
    cy.intercept('POST', '**/api/platform/admins').as('createAdmin')
    dialog().contains('button', 'Criar administrador da plataforma').click()
    cy.wait('@createAdmin').its('response.statusCode').should('eq', 201)
    cy.contains('tr', socioEmail).should('contain', 'Nunca acessou')
  })

  it('cria uma conta, encontra pela busca e cria o dono dela', () => {
    signIn(adminEmail)
    cy.visit('/pt/platform/tenants/new')
    cy.get('input[name="name"]').type('Imobiliária E2E')
    cy.get('input[name="slug"]').clear().type(tenantSlug)
    cy.intercept('POST', '**/api/platform/tenants').as('createTenant')
    cy.contains('button', 'Criar conta').click()
    cy.wait('@createTenant').its('response.statusCode').should('eq', 201)
    cy.location('pathname', { timeout: 60000 }).should('match', /^\/pt\/platform\/tenants\/.+/)
    cy.contains('h1', 'Imobiliária E2E').should('be.visible')

    cy.get('input[name="name"]').type('Dona da Imobiliária E2E')
    cy.get('input[name="email"]').type(tenantAdminEmail)
    cy.get('input[name="password"]').type('senha-longa-123')
    cy.get('input[name="confirmPassword"]').type('senha-longa-123')
    cy.contains('button', 'Criar administrador').click()
    cy.contains(tenantAdminEmail).should('be.visible')
    cy.reload()
    cy.contains('tr', tenantAdminEmail).should('contain', 'Dono da imobiliária')

    cy.visit('/pt/platform/tenants')
    cy.get('input[aria-label="Buscar conta"]').type(tenantSlug)
    cy.contains('tr', 'Imobiliária E2E').should('be.visible')
    cy.contains('1 conta').should('be.visible')
  })

  it('deixa o papel AGENT só ler: sem criar conta, sem editar e sem gerenciar admins', () => {
    signIn(agentEmail)
    cy.visit('/pt/platform/tenants')
    cy.contains('h1', 'Tenants').should('be.visible')
    cy.contains('a', 'Nova conta').should('not.exist')
    cy.get('button[aria-label^="Editar conta de"]').should('not.exist')

    cy.visit('/pt/platform/tenants/new')
    cy.contains('Só administradores com o papel Admin podem criar contas.').should('be.visible')

    cy.visit('/pt/platform/admins')
    cy.contains('tr', agentEmail).should('be.visible')
    cy.contains('button', 'Novo administrador').should('not.exist')
    cy.get('button[aria-label^="Ações para"]').should('not.exist')

    cy.request({
      method: 'POST',
      url: '/api/platform/tenants',
      body: { name: 'Proibida', slug: `${tenantSlug}-proibida` },
      failOnStatusCode: false,
    })
      .its('status')
      .should('be.oneOf', [401, 403])
  })
})
