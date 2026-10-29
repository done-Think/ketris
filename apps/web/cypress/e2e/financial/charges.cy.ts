import type { FinancialEvidence, FinancialFixtureResult } from '../../types/financial-fixtures'

const password = 'financial-local-e2e-password-123'
const listPath = '/pt/dashboard/finance/charges'
let fixture: FinancialFixtureResult | null = null

afterEach(() => {
  if (fixture) cy.task('cleanupFinancialFixtures', fixture.tenantIds)
  fixture = null
})

function setup(renter = false) {
  cy.task<FinancialFixtureResult>('seedFinancialFixtures', {
    suffix: Date.now() + '-' + Math.floor(Math.random() * 10000),
    password,
  }).then((result) => {
    fixture = result
    cy.visit('/pt/login')
    cy.get('input[name="email"]').type(renter ? result.renterEmail : result.ownerEmail)
    cy.get('input[name="password"]').type(password, { log: false })
    cy.get('button')
      .filter(':visible')
      .contains(/^Entrar$/)
      .click()
    cy.location('pathname', { timeout: 90000 }).should('not.include', '/login')
  })
}

function evidence() {
  return cy.then(() =>
    cy.task<FinancialEvidence>('readFinancialEvidence', fixture!.overdueChargeId),
  )
}

function dialog() {
  return cy.get('[role="dialog"]').filter(':visible').last()
}

function assertPageWidth() {
  cy.document().then((doc) => {
    expect(doc.documentElement.scrollWidth).to.be.at.most(doc.documentElement.clientWidth)
  })
}

describe('Charges real workflows', () => {
  it('lists the derived overdue status and keeps list and detail readable on mobile and desktop', () => {
    setup()
    for (const width of [375, 1280]) {
      cy.viewport(width, 900)
      cy.visit(listPath)
      cy.contains('button', /Atrasada/).click()
      cy.then(() => {
        cy.contains('tr', fixture!.overdueChargeCode).should('contain', 'Atrasada')
        cy.contains('tr', fixture!.scheduledChargeCode).should('not.exist')
      })
      assertPageWidth()
      cy.then(() =>
        cy.contains('button', fixture!.overdueChargeCode).filter(':visible').first().click(),
      )
      cy.location('pathname').should('match', /\/dashboard\/finance\/charges\/[^/]+$/)
      cy.contains('Apartamento Financial E2E').should('be.visible')
      cy.contains('button', 'Registrar pagamento').should('be.visible')
      assertPageWidth()
    }
    cy.visit(listPath)
    cy.contains('[role="tab"]', 'A pagar').click()
    cy.contains('tr', 'Manutenção a pagar E2E').should('be.visible')
  })

  it('registers a payment with receipt, reverses it with a reason and keeps the audit trail', () => {
    setup()
    cy.then(() => cy.visit(listPath + '/' + fixture!.overdueChargeId))
    cy.contains('button', 'Registrar pagamento').click()
    dialog().find('input[name="paymentDate"]').type('2026-10-20')
    dialog().find('input[name="paymentMethod"]').type('PIX')
    const storage = Cypress.expose('CONTRACTS_STORAGE_ENABLED') === true
    if (storage)
      dialog()
        .find('input[type="file"]')
        .selectFile(
          {
            contents: Cypress.Buffer.from('%PDF-1.4\n% comprovante E2E\n'),
            fileName: 'comprovante-e2e.pdf',
            mimeType: 'application/pdf',
          },
          { force: true },
        )
    cy.intercept('POST', '**/payment').as('payment')
    dialog().contains('button', 'Confirmar pagamento').click()
    cy.wait('@payment').its('response.statusCode').should('eq', 200)
    cy.contains('Pagamento registrado').should('be.visible')
    if (storage) cy.contains('button', 'Baixar comprovante-e2e.pdf').should('be.visible')
    cy.contains('button', 'Cancelar cobrança').should('not.exist')

    cy.contains('button', 'Estornar pagamento').click()
    dialog().contains('button', 'Estornar pagamento').click()
    dialog().should('contain', 'Informe o motivo')
    dialog().find('textarea').first().type('PIX devolvido ao locatário')
    cy.intercept('POST', '**/payment-reversal').as('reversal')
    dialog().contains('button', 'Estornar pagamento').click()
    cy.wait('@reversal').its('response.statusCode').should('eq', 200)
    cy.contains('Pagamento estornado').should('be.visible')
    cy.contains('Motivo: PIX devolvido ao locatário').should('be.visible')
    evidence().then((result) => {
      expect(result.status).to.eq('PENDING')
      expect(result.paidById).to.eq(null)
      expect(result.receiptCount).to.eq(storage ? 1 : 0)
      expect(result.auditActions).to.deep.eq(['PAYMENT_REGISTERED', 'PAYMENT_REVERSED'])
    })
  })

  it('cancels with a mandatory reason and never reopens', () => {
    setup()
    cy.then(() => cy.visit(listPath + '/' + fixture!.overdueChargeId))
    cy.contains('button', 'Cancelar cobrança').click()
    dialog().find('textarea').first().type('Contrato rescindido')
    cy.intercept('POST', '**/cancel').as('cancel')
    dialog().contains('button', 'Cancelar cobrança').click()
    cy.wait('@cancel').its('response.statusCode').should('eq', 200)
    cy.contains('Contrato rescindido').should('be.visible')
    cy.contains('button', 'Registrar pagamento').should('not.exist')
    cy.contains('button', 'Cancelar cobrança').should('not.exist')
    evidence().then((result) => {
      expect(result.status).to.eq('CANCELED')
      expect(result.cancellationReason).to.eq('Contrato rescindido')
      expect(result.auditActions).to.deep.eq(['CANCELLED'])
    })
  })

  it('creates a standalone charge and deletes it while it has no movement', () => {
    setup()
    cy.viewport(1280, 900)
    cy.visit(listPath)
    cy.contains('button', 'Nova cobrança').click()
    dialog().find('input[name="description"]').type('Taxa avulsa E2E')
    dialog().find('input[name="amount"]').clear().type('180')
    dialog().find('input[name="dueDate"]').type('2026-12-10')
    cy.intercept('POST', '**/api/financial/charges').as('create')
    dialog().contains('button', 'Criar cobrança').click()
    cy.wait('@create').its('response.statusCode').should('eq', 201)
    cy.contains('tr', 'Taxa avulsa E2E').within(() => {
      cy.get('button[aria-label^="Ações"]').click()
    })
    cy.contains('[role="menuitem"]', 'Excluir').click()
    cy.intercept('DELETE', '**/api/financial/charges/*').as('delete')
    dialog().contains('button', 'Excluir').click()
    cy.wait('@delete').its('response.statusCode').should('eq', 204)
    cy.contains('tr', 'Taxa avulsa E2E').should('not.exist')
  })

  it('shows the renter only the receivables of the contract, without management actions', () => {
    setup(true)
    cy.visit(listPath)
    cy.then(() => {
      cy.contains('tr', fixture!.overdueChargeCode).should('be.visible')
      cy.contains('tr', fixture!.payableChargeCode).should('not.exist')
    })
    cy.contains('button', 'Nova cobrança').should('not.exist')
    cy.then(() => cy.visit(listPath + '/' + fixture!.overdueChargeId))
    cy.contains('Aluguel atrasado E2E').should('be.visible')
    cy.contains('button', 'Registrar pagamento').should('not.exist')
    cy.contains('Histórico').should('not.exist')
  })
})
