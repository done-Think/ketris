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
      cy.then(() => cy.contains(fixture!.rentalPropertyTitle).should('exist'))
      cy.contains('Apartamento compacto – Pinheiros').should('not.exist')
      assertPageWidth()
    }
  })

  it('abre o detalhe do imóvel a partir dos destaques', () => {
    cy.viewport(1280, 900)
    cy.visit('/pt')
    cy.get('button[value="buy"]').first().click()
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

  it('updates featured listings immediately on desktop and mobile without leaving home', () => {
    for (const width of [1280, 375]) {
      cy.viewport(width, 900)
      cy.visit('/pt')
      cy.then(() => cy.contains(fixture!.rentalPropertyTitle).should('be.visible'))
      if (width < 600) cy.contains('button', 'Buscar por bairro, cidade...').click()
      cy.get('button[value="buy"]').filter(':visible').first().click()
      if (width < 600) cy.get('[aria-label="Fechar busca"]').click()
      cy.location('pathname').should('eq', '/pt')
      cy.then(() => {
        cy.contains(fixture!.propertyTitle).should('be.visible')
        cy.contains(fixture!.rentalPropertyTitle).should('not.exist')
        cy.contains('a', fixture!.dualPropertyTitle).within(() =>
          cy.contains(/900\.000/).should('be.visible'),
        )
      })
      if (width < 600) cy.contains('button', 'Buscar por bairro, cidade...').click()
      cy.get('button[value="rent"]').filter(':visible').first().click()
      if (width < 600) cy.get('[aria-label="Fechar busca"]').click()
      cy.location('pathname').should('eq', '/pt')
      cy.then(() => {
        cy.contains(fixture!.rentalPropertyTitle).should('be.visible')
        cy.contains(fixture!.propertyTitle).should('not.exist')
        cy.contains('a', fixture!.dualPropertyTitle).within(() =>
          cy.contains(/2\.500.*mês/).should('be.visible'),
        )
      })
    }
    cy.then(() => cy.contains('a', fixture!.dualPropertyTitle).first().click())
    cy.location('search').should('include', 'purpose=rent')
    cy.contains(/2\.500.*mês/).should('be.visible')
  })

  it('searches with an explicit maximum above ten thousand', () => {
    cy.viewport(1280, 900)
    cy.visit('/pt')
    cy.contains('button', 'Faixa de preço').click()
    cy.get('input').filter('[type="number"]').filter(':visible').last().as('maximumPrice')
    cy.get('@maximumPrice').should('not.have.attr', 'max')
    cy.get('@maximumPrice').type('750000')
    cy.contains('button', 'Aplicar').click()
    cy.get('button[value="buy"]').first().click()
    cy.contains('a', 'Buscar').first().click()
    cy.location('search').should('include', 'purpose=buy').and('include', 'priceRange=-750000')
    cy.then(() => {
      cy.contains('main', fixture!.propertyTitle).should('be.visible')
      cy.contains('main', fixture!.dualPropertyTitle).should('not.exist')
    })
  })

  it('selects a city without neighborhoods and searches all of its districts', () => {
    cy.viewport(1280, 900)
    cy.visit('/pt')
    cy.get('button[value="buy"]').first().click()
    cy.contains('button', 'Localização').click()
    cy.then(() =>
      cy
        .contains('[role="menuitem"]', fixture!.city, { timeout: 20000 })
        .should('have.text', fixture!.city)
        .should('be.visible')
        .click(),
    )
    cy.contains('a', 'Buscar')
      .first()
      .should(($link) => {
        const destination = new URL($link.attr('href')!, 'http://localhost')
        expect(destination.searchParams.get('city')).to.eq(fixture!.city)
        expect(destination.searchParams.has('location')).to.eq(false)
      })
      .click()
    cy.location('search', { timeout: 60000 }).should((search) => {
      expect(new URLSearchParams(search).get('city')).to.eq(fixture!.city)
    })
    cy.get('main').find('input').first().should('have.value', fixture!.city)
    cy.then(() => {
      cy.contains('main', fixture!.propertyTitle).should('be.visible')
      cy.contains('main', fixture!.dualPropertyTitle).should('be.visible')
    })
  })

  it('filtra a busca pública pelo código do tipo e pela cidade', () => {
    cy.viewport(1280, 900)
    cy.intercept('GET', '**/api/marketplace/properties?*').as('results')
    cy.then(() =>
      cy.visit(
        `/pt/imoveis?purpose=buy&location=${encodeURIComponent(fixture!.city)}&propertyType=HOUSE`,
      ),
    )
    cy.wait('@results').its('response.statusCode').should('eq', 200)
    cy.then(() => cy.contains(fixture!.propertyTitle).should('be.visible'))
    cy.then(() =>
      cy.visit(
        `/pt/imoveis?purpose=buy&location=${encodeURIComponent(fixture!.city)}&propertyType=APARTMENT`,
      ),
    )
    cy.wait('@results').its('response.statusCode').should('eq', 200)
    cy.then(() => {
      cy.contains(fixture!.dualPropertyTitle).should('be.visible')
      cy.contains(fixture!.propertyTitle).should('not.exist')
    })
  })
})
