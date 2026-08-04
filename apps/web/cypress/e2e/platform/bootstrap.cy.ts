describe('Plataforma — bootstrap do primeiro administrador geral (UI)', () => {
  before(() => {
    cy.task('resetPlatformBootstrap')
  })

  after(() => {
    cy.task('resetPlatformBootstrap')
  })

  it('cria o primeiro administrador da plataforma e bloqueia uma segunda tentativa de bootstrap', () => {
    const email = `e2e-platform-bootstrap-${Date.now()}@ketris.dev`

    cy.visit('/platform/setup')
    cy.get('input[name="nome"]').type('Alysson Sene')
    cy.get('input[name="email"]').type(email)
    cy.get('input[name="password"]').type('senha-longa-123')
    cy.get('input[name="confirmarSenha"]').type('senha-longa-123')
    cy.get('button[type="submit"]').click()

    cy.location('pathname').should('eq', '/platform/login')

    cy.visit('/platform/setup')
    cy.get('input[name="nome"]').type('Outro Admin')
    cy.get('input[name="email"]').type(`e2e-platform-bootstrap-outro-${Date.now()}@ketris.dev`)
    cy.get('input[name="password"]').type('senha-longa-123')
    cy.get('input[name="confirmarSenha"]').type('senha-longa-123')
    cy.get('button[type="submit"]').click()

    cy.contains('A plataforma já tem um administrador').should('be.visible')
    cy.location('pathname').should('eq', '/platform/setup')
  })

  it('exibe um link discreto para o bootstrap na tela de login da plataforma', () => {
    cy.visit('/platform/login')
    cy.contains('a', 'Ainda não há administrador da plataforma?')
      .should('be.visible')
      .and('have.attr', 'href', '/platform/setup')
  })
})
