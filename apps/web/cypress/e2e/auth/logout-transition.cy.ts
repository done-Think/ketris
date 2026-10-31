describe('Logout transitions', () => {
  const suffix = Date.now()
  const email = `logout-transition-${suffix}@example.test`
  const password = 'Logout-transition-e2e-123'
  let tenantId: string

  before(() => {
    cy.task<string>('seedAuthUser', { email, password, tenantSlug: `logout-${suffix}` }).then(
      (id) => {
        tenantId = id
      },
    )
  })
  after(() => {
    if (tenantId) cy.task('cleanupAuthUser', tenantId)
  })

  function login(path = '/dashboard') {
    cy.visit(`/pt/login?callbackUrl=${path}`)
    cy.get('input[name="email"]').type(email)
    cy.get('input[name="password"]').type(password, { log: false })
    cy.contains('button', /^Entrar$/).click()
    cy.location('pathname').should('eq', `/pt${path}`)
  }

  function holdLogoutResponses() {
    let releaseRevocation = () => {}
    let releaseMarketplace = () => {}
    const revocationGate = new Promise<void>((resolve) => {
      releaseRevocation = resolve
    })
    const marketplaceGate = new Promise<void>((resolve) => {
      releaseMarketplace = resolve
    })
    cy.intercept('POST', '**/api/auth/logout', (request) => {
      request.continue(() => revocationGate)
    }).as('revokeSession')
    cy.intercept('POST', '**/api/auth/signout').as('signOut')
    cy.intercept({ method: 'GET', pathname: /^\/pt\/?$/ }, (request) => {
      request.continue(() => marketplaceGate)
    })
    return { releaseRevocation, releaseMarketplace }
  }

  function watchAnonymousDashboard() {
    const flashes: string[] = []
    let observer: MutationObserver
    cy.window().then((win) => {
      observer = new win.MutationObserver((records) => {
        for (const record of records) {
          const sidebar = record.target.parentElement?.closest('aside')
          if (sidebar?.textContent?.includes('Equipe Ketris')) flashes.push(sidebar.textContent)
        }
      })
      observer.observe(win.document.body, { childList: true, subtree: true, characterData: true })
    })
    return () => {
      cy.then(() => {
        observer.disconnect()
        expect(flashes).to.deep.equal([])
      })
    }
  }

  function expectSignedOut(network: ReturnType<typeof holdLogoutResponses>) {
    cy.contains('[role="status"]', 'Saindo da conta…').should('be.visible')
    cy.get('aside').should('not.exist')
    cy.contains('Equipe Ketris').should('not.exist')
    cy.then(network.releaseRevocation)
    cy.wait('@revokeSession').its('response.statusCode').should('eq', 204)
    cy.wait('@signOut').its('response.statusCode').should('eq', 200)
    cy.getCookie('next-auth.session-token', { log: false }).should('be.null')
    cy.contains('[role="status"]', 'Saindo da conta…').should('be.visible')
    cy.get('aside').should('not.exist')
    cy.then(network.releaseMarketplace)
    cy.location('pathname', { timeout: 15000 }).should('eq', '/pt')
    cy.contains('a', /^Entrar$/).should('be.visible')
    cy.request({ url: '/api/auth/session', log: false }).then(({ body }) => {
      expect(body?.user).to.equal(undefined)
      expect(body?.tenantId).to.equal(undefined)
    })
  }

  it('hides the dashboard for the whole logout, including slow session cleanup and home navigation', () => {
    cy.viewport(1440, 900)
    const network = holdLogoutResponses()
    login()
    const checkFlashes = watchAnonymousDashboard()
    cy.get('button[aria-label="Sair e voltar para o marketplace"]').filter(':visible').click()
    expectSignedOut(network)
    checkFlashes()
  })

  it('also removes the mobile drawer immediately', () => {
    cy.viewport(390, 844)
    const network = holdLogoutResponses()
    login()
    cy.get('button[aria-label="Abrir navegação"]').click()
    cy.get('button[aria-label="Sair e voltar para o marketplace"]').filter(':visible').click()
    expectSignedOut(network)
    cy.get('.MuiDrawer-root').should('not.exist')
  })

  it('uses the same protected transition when signing out inside a profile preview', () => {
    cy.viewport(1440, 900)
    const network = holdLogoutResponses()
    login('/dashboard/public-profile/agency')
    cy.contains('button', 'Visualizar').click()
    cy.get('[role="dialog"]').within(() => {
      cy.get('button[aria-label="Abrir perfil"]').click()
    })
    cy.contains('button', /^Sair$/).click()
    expectSignedOut(network)
    cy.get('[role="dialog"]').should('not.exist')
  })
})
