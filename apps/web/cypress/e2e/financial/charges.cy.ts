describe('Charges demo', () => {
  before(() => {
    // Keep the browser window wider than the largest viewport so screenshots are not cropped.
    cy.then(() =>
      Cypress.automation('remote:debugger:protocol', { command: 'Browser.getWindowForTarget' }),
    ).then(({ windowId }) =>
      Cypress.automation('remote:debugger:protocol', {
        command: 'Browser.setWindowBounds',
        params: { windowId, bounds: { width: 1700, height: 1200 } },
      }),
    )
  })
  // Next development performance instrumentation can receive negative timestamps
  // inside Cypress's iframe. Ignore only that diagnostic; application errors still fail.
  beforeEach(() => {
    cy.on('uncaught:exception', (error) => {
      if (
        error.message.includes("Failed to execute 'measure' on 'Performance'") &&
        error.message.includes('negative time stamp') &&
        error.stack?.includes('flushComponentPerformance')
      )
        return false
    })
  })
  const listPath = '/pt/dashboard/finance/charges'
  const assertPageWidth = () =>
    cy.document().then((doc) => {
      expect(doc.documentElement.scrollWidth).to.be.at.most(doc.documentElement.clientWidth)
      const main = doc.querySelector('main')!.getBoundingClientRect()
      expect(main.right).to.be.at.most(doc.documentElement.clientWidth + 1)
      for (const element of doc.querySelectorAll('main button, main input, main [role="tab"]')) {
        if (element.closest('table')) continue // table overflow is intentionally contained
        const rect = element.getBoundingClientRect()
        if (!rect.width || !rect.height) continue
        expect(rect.left).to.be.at.least(-1)
        expect(rect.right).to.be.at.most(doc.documentElement.clientWidth + 1)
      }
    })

  for (const width of [375, 390, 430, 768, 1024, 1280, 1440]) {
    it(`keeps list, details and dialogs readable at ${width}px`, () => {
      cy.viewport(width, 900)
      cy.visit(listPath)
      cy.contains('h3', 'Cobranças').should('be.visible')
      cy.title().should('eq', 'Ketris | Cobranças')
      assertPageWidth()
      cy.contains('p', 'A receber este mês').then(($label) => {
        const card = $label.parent().parent()[0]
        const grid = card.parentElement!
        const cards = Array.from(grid.children).map((node) => node.getBoundingClientRect())
        if (width < 1200) {
          expect(cards[1].top).to.be.greaterThan(cards[0].bottom)
          expect(cards[2].top).to.be.greaterThan(cards[1].bottom)
          expect(Math.abs(cards[0].width - cards[2].width)).to.be.lessThan(1)
        } else {
          expect(cards[0].top).to.eq(cards[2].top)
        }
      })
      cy.get('.MuiTableContainer-root').then(($container) => {
        expect($container[0].getBoundingClientRect().right).to.be.at.most(width)
        expect(getComputedStyle($container[0]).overflowX).to.eq('auto')
      })
      if (width < 900) {
        cy.get('header').should('be.visible')
        cy.get('header button').last().click()
        cy.get('.MuiDrawer-paper').filter(':visible').should('contain', 'Cobranças')
        cy.get('body').type('{esc}')
      }
      if (width === 375 || width === 1440)
        cy.screenshot(`charges-list-${width}`, { capture: 'fullPage' })
      cy.contains('button', 'Nova Cobrança').click()
      cy.get('[role="dialog"]')
        .should('be.visible')
        .then(($dialog) => {
          const rect = $dialog[0].getBoundingClientRect()
          expect(rect.left).to.be.at.least(0)
          expect(rect.right).to.be.at.most(width)
        })
      cy.contains('button', 'Cancelar').click()
      cy.contains('button', '#COB-2025-0341').click()
      cy.location('pathname').should('eq', `${listPath}/0341`)
      cy.contains('button', 'Registrar pagamento').should('be.disabled')
      assertPageWidth()
      if (width === 375 || width === 1440)
        cy.screenshot(`charges-details-${width}`, { capture: 'fullPage' })
      cy.contains('button', 'Visualizar comprovante').click()
      cy.get('[role="dialog"]').should('contain', 'REC-0341').and('contain', 'Bruno Oliveira')
      cy.contains('button', 'Fechar documento').click()
      cy.contains('button', 'Voltar para Cobranças').click()
      cy.location('pathname').should('eq', listPath)
    })
  }

  it('navigates to a newly created charge and synchronizes its payment with the list', () => {
    cy.viewport(1280, 900)
    cy.visit(listPath)
    cy.contains('button', 'Nova Cobrança').click()
    cy.get('input[name="tenant"]').type('Demo E2E')
    cy.get('input[name="property"]').type('Apartment E2E')
    cy.get('input[name="amount"]').clear().type('1234')
    cy.get('input[name="dueDate"]').type('2025-03-20')
    cy.contains('button', 'Criar cobrança').click()
    cy.contains('tr', 'Demo E2E').find('button').first().click()
    cy.location('pathname').should('match', /\/charges\/0342$/)
    cy.contains('Demo E2E').should('be.visible')
    cy.contains('button', 'Registrar pagamento').click()
    cy.get('input[name="paymentDate"]').type('2025-03-21')
    cy.get('input[name="paymentMethod"]').type('Transferência')
    cy.contains('button', 'Confirmar pagamento').click()
    cy.contains('Pagamento recebido').should('be.visible')
    cy.contains('button', 'Visualizar comprovante').click()
    cy.get('[role="dialog"]').should('contain', 'Transferência').and('contain', '21/03/2025')
    cy.contains('button', 'Fechar documento').click()
    cy.contains('button', 'Voltar para Cobranças').click()
    cy.contains('tr', 'Demo E2E').should('contain', 'Pago')
  })
})
