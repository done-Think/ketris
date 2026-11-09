import type {
  MarketplaceFixtureResult,
  MarketplaceInquiryEvidence,
} from '../../types/marketplace-fixtures'

let fixture: MarketplaceFixtureResult | null = null

beforeEach(() => {
  cy.task<MarketplaceFixtureResult>('seedMarketplaceFixtures', {
    suffix: Date.now() + '-' + Math.floor(Math.random() * 10000),
    password: 'marketplace-local-e2e-password-123',
  }).then((result) => {
    fixture = result
  })
})

afterEach(() => {
  if (fixture) cy.task('cleanupMarketplaceFixtures', fixture.tenantIds)
  fixture = null
})

function dialog() {
  return cy.get('[role="dialog"]').filter(':visible').last()
}

function evidence() {
  return cy.then(() =>
    cy.task<MarketplaceInquiryEvidence>('readMarketplaceInquiryEvidence', fixture!.propertyId),
  )
}

function openProposal() {
  cy.then(() => cy.visit('/pt/properties/' + fixture!.propertyId))
  cy.then(() => cy.contains('h1', fixture!.propertyTitle).should('be.visible'))
  cy.contains('button', 'Enviar proposta').click()
  dialog().should('contain', 'Deixe seus dados e, se quiser, o valor proposto')
}

describe('Proposta pelo marketplace', () => {
  it('valida os campos e cria a oportunidade no CRM do tenant do imóvel', () => {
    let opportunityId: string
    cy.getCookie('next-auth.session-token').should('be.null')
    for (const width of [375, 1280]) {
      cy.viewport(width, 900)
      openProposal()
      dialog().contains('button', 'Enviar').click()
      dialog().should('contain', 'Informe seu nome').and('contain', 'Informe um e-mail válido')
      dialog().contains('button', 'Cancelar').click()
    }
    evidence().its('count').should('eq', 0)

    cy.viewport(1280, 900)
    openProposal()
    dialog().find('input[name="leadName"]').type('Interessada Proposta E2E')
    dialog().find('input[name="leadEmail"]').type('interessada@proposta.example.test')
    dialog().find('input[name="leadPhone"]').type('(41) 99999-0000')
    dialog().find('input[name="proposedValue"]').clear().type('600000')
    dialog().find('textarea[name="notes"]').type('Posso negociar a entrada.')
    cy.intercept('POST', '**/api/marketplace/properties/*/inquiries').as('inquiry')
    dialog().contains('button', 'Enviar').click()
    cy.wait('@inquiry').then(({ response }) => {
      expect(response?.statusCode).to.eq(201)
      opportunityId = response?.body.inquiry.id
    })
    cy.contains('Mensagem enviada! O corretor vai entrar em contato em breve.').should('be.visible')
    cy.get('[role="dialog"]').should('not.exist')
    evidence().then((result) => {
      expect(result.count).to.eq(1)
      expect(result.leadCount).to.eq(1)
      expect(result.linked).to.eq(true)
      expect(result.status).to.eq('SENT')
      expect(result.leadName).to.eq('Interessada Proposta E2E')
      expect(result.leadEmail).to.eq('interessada@proposta.example.test')
      expect(result.proposedValue).to.eq(600000)
      expect(result.notes).to.eq('Posso negociar a entrada.')
    })
    cy.then(() => cy.visit('/pt/login?callbackUrl=/dashboard/leads'))
    cy.then(() => cy.get('input[name="email"]').type(fixture!.brokerEmail))
    cy.get('input[name="password"]').type('marketplace-local-e2e-password-123', { log: false })
    cy.contains('button', /^Entrar$/).click()
    cy.location('pathname').should('eq', '/pt/dashboard/leads')
    cy.get('table').contains('tr', 'Interessada Proposta E2E').contains('button', 'Contato').click()
    cy.contains('button', 'Converter em oportunidade').should('not.exist')
    cy.contains('a', 'Ver oportunidade').click()
    cy.then(() => cy.location('pathname').should('eq', '/pt/crm/opportunities/' + opportunityId))
    evidence().its('count').should('eq', 1)
  })

  it('usa o preço do imóvel quando o valor proposto fica vazio', () => {
    cy.viewport(1280, 900)
    openProposal()
    dialog().find('input[name="leadName"]').type('Sem Valor E2E')
    dialog().find('input[name="leadEmail"]').type('sem-valor@proposta.example.test')
    dialog().find('input[name="proposedValue"]').clear()
    cy.intercept('POST', '**/api/marketplace/properties/*/inquiries').as('inquiry')
    dialog().contains('button', 'Enviar').click()
    cy.wait('@inquiry').its('response.statusCode').should('eq', 201)
    evidence().its('proposedValue').should('eq', 650000)
  })

  it('avisa a cota por imóvel/e-mail sem criar oportunidades além dela', () => {
    cy.viewport(1280, 900)
    cy.then(() => {
      for (let attempt = 0; attempt < 3; attempt += 1)
        cy.request({
          method: 'POST',
          url: `/api/marketplace/properties/${fixture!.propertyId}/inquiries`,
          body: { leadName: 'Lote E2E', leadEmail: 'cota@proposta.example.test' },
        })
    })
    openProposal()
    dialog().find('input[name="leadName"]').type('Bloqueada E2E')
    dialog().find('input[name="leadEmail"]').type('cota@proposta.example.test')
    cy.intercept('POST', '**/api/marketplace/properties/*/inquiries').as('inquiry')
    dialog().contains('button', 'Enviar').click()
    cy.wait('@inquiry').its('response.statusCode').should('eq', 429)
    cy.contains('Você enviou muitas mensagens em pouco tempo').should('be.visible')
    evidence().its('count').should('eq', 3)
  })
})
