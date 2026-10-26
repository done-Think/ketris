import type {
  MarketplaceFixtureResult,
  MarketplaceInquiryEvidence,
} from '../../types/marketplace-fixtures'

const password = 'marketplace-local-e2e-password-123'
let fixture: MarketplaceFixtureResult | null = null

beforeEach(() => cy.viewport(1440, 1000))

afterEach(() => {
  if (fixture) cy.task('cleanupMarketplaceFixtures', [fixture.tenantId])
  fixture = null
})

describe('Proposta pelo marketplace', () => {
  it('o visitante envia uma proposta e ela vira oportunidade no CRM da imobiliária', () => {
    const suffix = Date.now() + '-' + Math.floor(Math.random() * 10000)
    const leadName = 'Visitante E2E ' + suffix
    const leadEmail = 'visitante-' + suffix + '@marketplace.example.test'

    cy.task<MarketplaceFixtureResult>('seedMarketplaceFixtures', { suffix, password }).then(
      (result) => {
        fixture = result
        cy.visit('/pt/imoveis/' + result.propertyId)
      },
    )
    cy.then(() => cy.contains(fixture!.propertyTitle, { timeout: 90000 }).should('be.visible'))

    cy.contains('button', 'Enviar proposta').click()
    cy.get('[role="dialog"]').within(() => {
      cy.contains('label', 'Nome').parent().find('input').type(leadName)
      cy.contains('label', 'E-mail').parent().find('input').type(leadEmail)
      cy.contains('label', 'Valor proposto').parent().find('input').type('2650')
      cy.intercept('POST', '**/api/marketplace/properties/*/inquiries').as('inquiry')
      cy.contains('button', /^Enviar$/).click()
    })
    cy.wait('@inquiry').its('response.statusCode').should('eq', 201)
    cy.contains('Mensagem enviada!').should('be.visible')

    cy.then(() =>
      cy
        .task<MarketplaceInquiryEvidence[]>('readMarketplaceInquiries', {
          tenantId: fixture!.tenantId,
          propertyId: fixture!.propertyId,
        })
        .then((inquiries) => {
          expect(inquiries).to.have.length(1)
          expect(inquiries[0]).to.include({
            tenantId: fixture!.tenantId,
            leadName,
            leadEmail,
            proposedValue: 2650,
            status: 'ENVIADA',
          })
          return cy.wrap(inquiries[0])
        })
        .then((inquiry) => {
          // Typing before the login page hydrates drops characters, so wait for the session check.
          cy.intercept('GET', '**/api/auth/session').as('session')
          cy.visit('/pt/login')
          cy.wait('@session')
          cy.get('input[name="email"]').type(fixture!.ownerEmail)
          cy.get('input[name="email"]').should('have.value', fixture!.ownerEmail)
          cy.get('input[name="password"]').type(password, { log: false })
          cy.get('button')
            .filter(':visible')
            .contains(/^Entrar$/)
            .click()
          cy.location('pathname', { timeout: 90000 }).should('not.include', '/login')
          cy.visit('/pt/crm/opportunities/' + inquiry.id)
          cy.contains(leadName, { timeout: 90000 }).should('be.visible')
        }),
    )
  })
})
