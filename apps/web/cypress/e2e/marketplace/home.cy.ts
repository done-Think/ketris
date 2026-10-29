import type { MarketplaceFixtureResult } from '../../types/marketplace-fixtures'

let fixture: MarketplaceFixtureResult | null = null

before(() => {
  cy.task<MarketplaceFixtureResult>('seedMarketplaceFixtures', {
    suffix: Date.now() + '-' + Math.floor(Math.random() * 10000),
    password: 'marketplace-local-e2e-password-123',
  }).then((result) => {
    fixture = result
  })
})

after(() => {
  if (fixture) cy.task('cleanupMarketplaceFixtures', fixture.tenantIds)
  fixture = null
})

function assertPageWidth() {
  cy.document().then((doc) => {
    expect(doc.documentElement.scrollWidth).to.be.at.most(doc.documentElement.clientWidth)
  })
}

describe('Home pública do marketplace', () => {
  it('mostra os números reais e o imóvel publicado mais recente, sem dados fictícios', () => {
    for (const width of [375, 1280]) {
      cy.viewport(width, 900)
      cy.visit('/pt')
      cy.contains('h1', 'A infraestrutura digital').should('be.visible')
      if (width >= 600) {
        cy.contains(/imóve(l|is) publicados?/).should('be.visible')
        cy.contains(/corretor(es)? parceiros?/).should('be.visible')
      }
      cy.contains('Imóveis em destaque').should('be.visible')
      cy.then(() => cy.contains(fixture!.propertyTitle).should('exist'))
      cy.contains('Apartamento compacto – Pinheiros').should('not.exist')
      assertPageWidth()
    }
  })

  it('abre o detalhe do imóvel a partir dos destaques', () => {
    cy.viewport(1280, 900)
    cy.visit('/pt')
    cy.then(() => cy.contains('a', fixture!.propertyTitle).first().click())
    cy.location('pathname', { timeout: 60000 }).should('match', /\/imoveis\/[^/]+$/)
    cy.then(() => {
      cy.contains('h1', fixture!.propertyTitle).should('be.visible')
      cy.contains(fixture!.brokerName).should('be.visible')
    })
    cy.contains('button', 'Enviar proposta').should('be.visible')
  })

  it('troca o idioma do detalhe público preservando o imóvel, filtros, fragmento e cookie', () => {
    cy.viewport(1280, 900)
    cy.then(() => {
      cy.visit(`/pt/imoveis/${fixture!.propertyId}?area=one&area=two#details`)
      cy.contains('h1', fixture!.propertyTitle).should('be.visible')
      cy.contains('button', 'BR').first().click()
      cy.contains('[role="menuitem"]', 'Espanhol').click()
      cy.location('pathname', { timeout: 60000 }).should(
        'eq',
        `/es/inmuebles/${fixture!.propertyId}`,
      )
      cy.location('search').should('eq', '?area=one&area=two')
      cy.location('hash').should('eq', '#details')
      cy.getCookie('NEXT_LOCALE').its('value').should('eq', 'es-ES')
      cy.contains('h1', fixture!.propertyTitle).should('be.visible')
    })
  })

  it('envia a finalidade escolhida no seletor Alugar/Comprar para a busca', () => {
    cy.viewport(1280, 900)
    cy.visit('/pt')
    cy.get('button[value="buy"]').first().click()
    cy.contains('a', 'Buscar').first().click()
    cy.location('search', { timeout: 60000 }).should('contain', 'purpose=buy')
  })

  it('busca o imóvel ao selecionar a sugestão real de bairro e cidade', () => {
    cy.viewport(1280, 900)
    cy.visit('/pt')
    cy.get('button[value="buy"]').first().click()
    cy.contains('button', 'Localização').click()
    cy.then(() =>
      cy
        .contains('[role="menuitem"]', `Centro, ${fixture!.city}`, { timeout: 20000 })
        .should('be.visible')
        .click(),
    )
    cy.contains('a', 'Buscar').first().click()
    cy.location('search').then((search) => {
      expect(new URLSearchParams(search).get('location')).to.eq(`Centro, ${fixture!.city}`)
    })
    cy.get('main').find('input').first().should('have.value', `Centro, ${fixture!.city}`)
    cy.then(() => cy.contains('main', fixture!.propertyTitle).should('be.visible'))
  })

  it('filtra a busca pública pelo código do tipo e pela cidade', () => {
    cy.viewport(1280, 900)
    cy.then(() => {
      const location = encodeURIComponent(fixture!.city)
      cy.visit(`/pt/properties?purpose=comprar&location=${location}&propertyType=CASA`)
      cy.contains(fixture!.propertyTitle).should('be.visible')
      cy.visit(`/pt/properties?purpose=comprar&location=${location}&propertyType=APARTAMENTO`)
      cy.contains(fixture!.propertyTitle).should('not.exist')
    })
  })
})
