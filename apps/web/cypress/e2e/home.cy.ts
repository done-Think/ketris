describe('Home (marketplace público)', () => {
  it('carrega a página inicial', () => {
    cy.visit('/')
    cy.contains('Ketris')
  })
})
