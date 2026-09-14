describe('Autenticação', () => {
  it('exibe a tela e valida os campos obrigatórios', () => {
    cy.visit('/login')
    cy.contains('Entrar na sua conta')
    cy.contains('button', 'Entrar').click()
    cy.contains('Informe seu e-mail')
    cy.contains('Informe sua senha')
  })

  const databaseTest = Cypress.env('DATABASE_AVAILABLE') ? it : it.skip

  databaseTest('entra com o usuário de desenvolvimento e abre o dashboard', () => {
    cy.visit('/login')
    cy.get('input[name="email"]').type('admin@ketris.dev')
    cy.get('input[name="password"]').type('trocar-em-desenvolvimento')
    cy.contains('button', 'Entrar').click()
    cy.url().should('include', '/dashboard')
    cy.contains('Painel')
  })
})
