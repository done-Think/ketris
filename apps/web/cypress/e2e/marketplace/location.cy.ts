import type { MarketplaceFixtureResult } from '../../types/marketplace-fixtures'

describe('Marketplace location and map', () => {
  const coordinates = { latitude: -22.425, longitude: -45.453 }
  let fixture: MarketplaceFixtureResult
  before(() => {
    cy.task<MarketplaceFixtureResult>('seedMarketplaceFixtures', {
      suffix: `location-${Date.now()}`,
      password: 'location-e2e-password-123',
      coordinates,
    }).then((value) => {
      fixture = value
    })
  })
  after(() => {
    if (fixture) cy.task('cleanupMarketplaceFixtures', fixture.tenantIds)
  })
  beforeEach(() => {
    cy.viewport(1440, 900)
    cy.intercept('GET', 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json', {
      body: {
        version: 8,
        sources: {},
        layers: [
          { id: 'background', type: 'background', paint: { 'background-color': '#eeeeee' } },
        ],
      },
    })
  })
  function visitSearch(allowed: boolean, city?: string) {
    cy.visit(`/pt/imoveis?purpose=buy${city ? `&city=${encodeURIComponent(city)}` : ''}`, {
      onBeforeLoad(win) {
        const getCurrentPosition = cy
          .stub()
          .callsFake((success, error) => {
            if (allowed) success({ coords: coordinates })
            else error({ code: 1, message: 'Permission denied' })
          })
          .as('getPosition')
        Object.defineProperty(win.navigator, 'geolocation', {
          configurable: true,
          value: { getCurrentPosition },
        })
      },
    })
  }
  it('centers on the viewer, requests nearby matches and reuses permission when switching to rent', () => {
    cy.intercept('GET', '**/api/marketplace/properties*', (req) => {
      if (req.query.latitude !== undefined) req.alias = 'nearby'
    })
    visitSearch(true)
    cy.wait('@nearby').then(({ request }) => {
      expect(request.query).to.include({
        latitude: String(coordinates.latitude),
        longitude: String(coordinates.longitude),
        purpose: 'SALE',
      })
    })
    cy.contains('Imóveis ordenados pela proximidade.').should('be.visible')
    cy.get('[aria-label="Sua localização aproximada"]')
      .should('be.visible')
      .should(($point) => {
        const map = $point.closest('.maplibregl-map')[0].getBoundingClientRect()
        const point = $point[0].getBoundingClientRect()
        expect(Math.abs(point.x + point.width / 2 - (map.x + map.width / 2))).to.be.lessThan(5)
        expect(Math.abs(point.y + point.height / 2 - (map.y + map.height / 2))).to.be.lessThan(5)
      })
    cy.contains('a', /^Alugar$/)
      .first()
      .click()
    cy.wait('@nearby').its('request.query.purpose').should('eq', 'RENT')
    cy.get('@getPosition').should('have.been.calledOnce')
    cy.contains(fixture.rentalPropertyTitle).should('be.visible')
  })
  it('keeps search usable after denial and frames the actual property markers', () => {
    visitSearch(false)
    cy.contains('Não foi possível obter sua localização.').should('be.visible')
    cy.get('[aria-label="Sua localização aproximada"]').should('not.exist')
    cy.get('.maplibregl-map [aria-label^="Abrir "]')
      .should('have.length', 2)
      .each(($marker) => {
        cy.wrap($marker).should(($element) => {
          const map = $element.closest('.maplibregl-map')[0].getBoundingClientRect()
          const marker = $element[0].getBoundingClientRect()
          expect(marker.x).to.be.at.least(map.x)
          expect(marker.right).to.be.at.most(map.right)
          expect(marker.y).to.be.at.least(map.y)
          expect(marker.bottom).to.be.at.most(map.bottom)
        })
      })
    cy.get('@getPosition').should('have.been.calledOnce')
  })
  it('honors an explicit city without requesting the device location', () => {
    cy.intercept('GET', '**/api/marketplace/properties*').as('citySearch')
    visitSearch(true, fixture.city)
    cy.wait('@citySearch').its('request.query').should('include', { city: fixture.city })
    cy.contains(fixture.propertyTitle).should('be.visible')
    cy.get('@getPosition').should('not.have.been.called')
    cy.get('[aria-label="Sua localização aproximada"]').should('not.exist')
  })
  it('shows the property price on its marker and synchronizes card and marker highlights in both directions', () => {
    visitSearch(false, fixture.city)
    const card = `.MuiCard-root[data-property-id="${fixture.propertyId}"]`
    const marker = `.maplibregl-map [data-property-id="${fixture.propertyId}"]`
    const otherCard = `.MuiCard-root[data-property-id="${fixture.dualPropertyId}"]`
    const otherMarker = `.maplibregl-map [data-property-id="${fixture.dualPropertyId}"]`
    cy.get(marker).should('be.visible').and('contain.text', '650.000')
    cy.get(card).trigger('mouseover')
    cy.get(marker).should('have.attr', 'data-highlighted', 'true')
    cy.get(otherMarker).trigger('mouseover')
    cy.get(otherCard).should('have.attr', 'data-highlighted', 'true')
    cy.get(card).should('have.attr', 'data-highlighted', 'false')
    cy.get(marker).focus()
    cy.get(card).should('have.attr', 'data-highlighted', 'true')
    cy.get(marker).click()
    cy.location('pathname').should('include', fixture.propertyId)
  })
})
