import type { MarketplaceFixtureResult } from '../../types/marketplace-fixtures'

const password = 'marketplace-local-e2e-password-123'
let fixture: MarketplaceFixtureResult | null = null

beforeEach(() => {
  cy.task<MarketplaceFixtureResult>('seedMarketplaceFixtures', {
    suffix: Date.now() + '-' + Math.floor(Math.random() * 10000),
    password,
  }).then((result) => {
    fixture = result
  })
})

afterEach(() => {
  if (fixture) cy.task('cleanupMarketplaceFixtures', fixture.tenantIds)
  fixture = null
})

describe('Favoritos no marketplace', () => {
  it('salva depois do login, mostra na aba e remove com desfazer', () => {
    cy.viewport(1280, 900)
    cy.then(() => cy.visit('/pt/properties/' + fixture!.propertyId))
    cy.then(() => cy.contains('h1', fixture!.propertyTitle).should('be.visible'))
    cy.contains('button', 'Compartilhar').should('be.visible')

    cy.contains('button', 'Favoritar').should('be.visible').click()
    cy.get('[role="dialog"]').should('contain', 'Entre para salvar este imóvel')
    cy.get('[role="dialog"]').contains('button', 'Entrar').click()
    cy.location('pathname').should('eq', '/pt/login')
    cy.then(() => cy.get('input[name="email"]').type(fixture!.brokerEmail))
    cy.get('input[name="password"]').type(password, { log: false })
    cy.intercept('PUT', '**/api/marketplace/favorites/*').as('save')
    cy.contains('button', /^Entrar$/).click()

    cy.wait('@save').its('response.statusCode').should('eq', 200)
    cy.then(() => cy.location('pathname').should('contain', fixture!.propertyId))
    cy.location('search').should('not.contain', 'saveFavorite')
    cy.contains('button', 'Favoritado').should('have.attr', 'aria-pressed', 'true')

    cy.visit('/pt/favoritos')
    cy.contains('h1', 'Meus favoritos').should('be.visible')
    cy.contains('1 imóvel salvo').should('be.visible')
    cy.then(() => cy.contains(fixture!.propertyTitle).should('be.visible'))

    cy.intercept('DELETE', '**/api/marketplace/favorites/*').as('remove')
    cy.get('button[aria-label="Remover dos favoritos"]').click()
    cy.wait('@remove').its('response.statusCode').should('eq', 204)
    cy.contains('Você ainda não salvou nenhum imóvel').should('be.visible')

    cy.contains('button', 'Desfazer').click()
    cy.wait('@save').its('response.statusCode').should('eq', 200)
    cy.contains('1 imóvel salvo').should('be.visible')
  })
})
