describe('Owner Dashboard', () => {
  const runId = Date.now()
  const tenantSlug = `e2e-owner-dashboard-${runId}`
  const adminEmail = `e2e-owner-dashboard-admin-${runId}@ketris.dev`
  const ownerEmail = `e2e-owner-dashboard-owner-${runId}@ketris.dev`
  const password = 'senha-correta-123'
  let tenantId: string

  const ownerSession = {
    user: {
      id: 'owner-e2e',
      name: 'Carlos Oliveira',
      email: ownerEmail,
      image: null,
    },
    expires: '2099-12-31T23:59:59.999Z',
    scope: 'tenant',
    tenantId: 'tenant-e2e',
    papel: 'OWNER',
  }

  function loginAsOwner() {
    cy.intercept('GET', '**/api/auth/session', ownerSession).as('ownerSession')

    cy.visit('/login')
    cy.get('input[name="email"]').type(ownerEmail)
    cy.get('input[name="password"]').type(password)
    cy.get('button[type="submit"]').click()
    cy.location('pathname').should('eq', '/dashboard')
    cy.document().then((document) => document.fonts.ready)
  }

  function expectNoHorizontalOverflow() {
    cy.document().then((document) => {
      expect(document.documentElement.scrollWidth).to.eq(document.documentElement.clientWidth)
    })
  }

  before(() => {
    cy.task('seedAuthUser', {
      email: adminEmail,
      password,
      tenantSlug,
    }).then((id) => {
      tenantId = id as string
      return cy.task('seedUserInTenant', {
        tenantId,
        email: ownerEmail,
        password,
        papel: 'OWNER',
      })
    })
  })

  after(() => {
    if (!tenantId) return

    cy.task('cleanupAuthUser', tenantId)
  })

  beforeEach(() => {
    cy.clearCookies()
  })

  it('matches the complete desktop reference structure', () => {
    cy.viewport(1440, 960)
    loginAsOwner()

    cy.get('h1').should('have.text', 'Painel do Proprietário')
    cy.get('a[href="/dashboard/imoveis/novo"]')
      .contains('Anunciar Novo Imóvel')
      .should('be.visible')
    cy.get('[aria-label="Indicadores do painel do proprietário"] article').should('have.length', 4)
    cy.get('#recent-proposals-title').should('have.text', 'Propostas Recentes')
    cy.get('table[aria-label="Propostas recentes do proprietário"]').should('be.visible')
    cy.get('#upcoming-visits-title').should('have.text', 'Próximas Visitas')
    cy.get('#weekly-performance-title').should('have.text', 'Desempenho Semanal')
    cy.get('#quick-actions-title').should('have.text', 'Atalhos Rápidos')
    cy.get('nav[aria-label="Navegação principal do proprietário"]')
      .find('a[aria-current="page"]')
      .should('have.text', 'Painel')
    expectNoHorizontalOverflow()
    cy.screenshot('owner-dashboard-desktop', { capture: 'viewport' })
  })

  it('keeps the owner navigation contained near its desktop breakpoint', () => {
    cy.viewport(1024, 768)
    loginAsOwner()

    cy.get('nav[aria-label="Navegação principal do proprietário"]').should('be.visible')
    cy.get('button[aria-label="Abrir menu"]').should('not.be.visible')
    expectNoHorizontalOverflow()
  })

  ;[
    { width: 390, height: 844 },
    { width: 375, height: 812 },
  ].forEach(({ width, height }) => {
    it(`adapts the dashboard and navigation to ${width}x${height}`, () => {
      cy.viewport(width, height)
      loginAsOwner()

      cy.get('h1').should('be.visible')
      cy.get('table[aria-label="Propostas recentes do proprietário"]').should('not.be.visible')
      cy.get('[aria-label="Lista móvel de propostas recentes"]')
        .should('be.visible')
        .within(() => {
          cy.get('button[aria-label^="Aceitar proposta"]').should('have.length', 4)
          cy.contains('Mariana Costa').should('be.visible')
          cy.contains('R$ 4.500/mês').should('be.visible')
        })
      expectNoHorizontalOverflow()
      cy.screenshot(`owner-dashboard-mobile-${width}`, { capture: 'fullPage' })

      cy.get('button[aria-label="Abrir menu"]').click()
      cy.get('#owner-mobile-navigation').within(() => {
        cy.get('nav[aria-label="Navegação móvel do proprietário"]').should('be.visible')
        cy.contains('Carlos Oliveira').should('be.visible')
      })
      cy.screenshot(`owner-dashboard-mobile-navigation-${width}`, { capture: 'viewport' })
      cy.get('button[aria-label="Fechar menu"]').click()
      cy.get('nav[aria-label="Navegação móvel do proprietário"]').should('not.exist')
    })
  })
})
