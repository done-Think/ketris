describe('Contratos (UI)', () => {
  const tenantSlug = `e2e-tenant-contracts-${Date.now()}`
  const email = `e2e-contracts-${Date.now()}@ketris.dev`
  const password = 'senha-correta-123'
  let tenantId: string

  before(() => {
    cy.task('seedAuthUser', { email, password, tenantSlug }).then((id) => {
      tenantId = id as string
    })
  })

  after(() => {
    cy.task('cleanupAuthUser', tenantId)
  })

  it('gera um contrato pelo assistente e ele aparece na listagem', () => {
    cy.visit('/login')
    cy.get('input[name="email"]').type(email)
    cy.get('input[name="password"]').type(password)
    cy.contains('button', 'Entrar').click()
    cy.location('pathname').should('include', '/dashboard')

    cy.visit('/dashboard/contracts')
    cy.contains('Contratos').should('be.visible')

    cy.contains('button', 'Novo Contrato').click()
    cy.location('pathname').should('include', '/dashboard/contracts/new')
    cy.contains('Partes do Contrato').should('be.visible')

    const tenantName = `Inquilino E2E ${Date.now()}`
    cy.get('input[name="tenantName"]').clear().type(tenantName)

    cy.contains('button', 'Próximo passo').click()
    cy.contains('Imóvel do Contrato').should('be.visible')

    cy.contains('button', 'Próximo passo').click()
    cy.contains('Condições do Contrato').should('be.visible')

    cy.contains('button', 'Próximo passo').click()
    cy.contains('Revisão do Contrato').should('be.visible')

    cy.contains('button', 'Gerar contrato').click()

    cy.location('pathname').should('include', '/dashboard/contracts')
    cy.location('pathname').should('not.include', '/new')
    cy.contains('adicionado em revisão').should('be.visible')

    cy.get('input[placeholder="Buscar contratos..."]').type(tenantName)
    cy.contains(tenantName).should('be.visible')
  })
})
