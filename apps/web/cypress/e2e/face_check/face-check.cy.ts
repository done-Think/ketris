import type { CrmFixtureResult } from '../../types/crm-fixtures'
import type { FaceCheckInvitationTestEmail } from '../../types/auth-mailbox'
import portuguese from '../../../src/i18n/messages/pt-BR/face_check.json'
import english from '../../../src/i18n/messages/en-US/face_check.json'
import spanish from '../../../src/i18n/messages/es-ES/face_check.json'

const password = 'face-check-local-e2e-password-123'
let fixture: CrmFixtureResult | undefined
let created: { id: string; token: string } | undefined
let candidate: { email: string; otherEmail: string } | undefined

function login(email: string) {
  cy.visit('/pt/login')
  cy.get('input[name="email"]').type(email)
  cy.get('input[name="password"]').type(password, { log: false })
  cy.get('button')
    .filter(':visible')
    .contains(/^Entrar$/)
    .click()
  cy.location('pathname', { timeout: 90000 }).should('not.include', '/login')
}

function create(agent = false, withCandidate = false) {
  cy.task<CrmFixtureResult>('seedCrmFixtures', {
    suffix: `face-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    password,
    empty: true,
  }).then((result) => {
    fixture = result
    if (withCandidate)
      cy.task<{ email: string; otherEmail: string }>('seedCrmFaceCheckCandidates', {
        tenantId: result.foreignTenantId,
        suffix: `face-${Date.now()}`,
        password,
      }).then((value) => {
        candidate = value
      })
    login(agent ? result.agentEmail : result.ownerEmail)
  })
  cy.visit('/pt/dashboard/face_check')
  cy.intercept('GET', '**/api/face_check/properties').as('availableProperties')
  cy.contains('button', 'Nova verificação').click()
  cy.wait('@availableProperties').its('response.statusCode').should('eq', 200)
  cy.get('input[name="propertyId"]')
    .parent()
    .find('[role="combobox"]')
    .should('not.have.attr', 'aria-disabled', 'true')
    .click()
  cy.contains('[role="option"]', 'Imóvel de outro tenant').should('not.exist')
  if (agent) cy.contains('[role="option"]', 'Casa da gestão CRM').should('not.exist')
  cy.contains('[role="option"]', 'Apartamento CRM disponível').click()
  cy.get('input[name="personName"]').type('Pessoa Teste Face Check')
  if (withCandidate) cy.then(() => cy.get('input[name="contact"]').type(candidate!.email))
  cy.intercept('POST', '**/api/face_check/sessions').as('createVerification')
  cy.get('[role="dialog"]').contains('button', portuguese.console.newVerification.submit).click()
  cy.wait('@createVerification').then(({ response }) => {
    expect(response?.statusCode).to.eq(201)
    expect(response?.body.session.propertyId).to.eq(fixture!.availablePropertyId)
    created = response?.body.session
  })
}

beforeEach(() => {
  fixture = undefined
  created = undefined
  candidate = undefined
  cy.viewport(1440, 1000)
})
afterEach(() => {
  if (fixture) cy.task('cleanupCrmFixtures', [fixture.tenantId, fixture.foreignTenantId])
})

describe('Face Check real authorization and invited capture', () => {
  it('opens the overview from the sidebar with three child links and hydrates without changing root classes', () => {
    create()
    cy.visit('/pt/dashboard/face_check', {
      onBeforeLoad(window) {
        cy.spy(window.console, 'error').as('faceConsoleErrors')
      },
    })
    cy.get('nav:visible').within(() => {
      cy.contains('a', /^Face Check$/).should('have.attr', 'href', '/pt/dashboard/face_check')
      cy.contains('a', 'Visão geral').should('not.exist')
      cy.contains('a', 'Sessões').click()
    })
    cy.location('pathname').should('eq', '/pt/dashboard/face_check/sessions')
    cy.get('nav:visible')
      .contains('a', /^Revisão$/)
      .click()
    cy.location('search').should('eq', '?filter=review')
    cy.get('nav:visible')
      .contains('a', /^Configurações$/)
      .click()
    cy.location('pathname').should('eq', '/pt/dashboard/face_check/settings')
    cy.get('nav:visible')
      .contains('a', /^Face Check$/)
      .click()
    cy.location('pathname').should('eq', '/pt/dashboard/face_check')
    cy.document()
      .its('documentElement.classList')
      .invoke('contains', 'sentry-block')
      .should('eq', false)
    cy.get('@faceConsoleErrors').should((spy) => {
      const calls = (spy as unknown as { getCalls(): { args: unknown[] }[] }).getCalls()
      expect(calls.some((call) => /hydration|hydrated|#418|#425/i.test(call.args.join(' ')))).to.eq(
        false,
      )
    })
  })

  it('lets the linked renter start capture from their own account and isolates another renter', () => {
    create(false, true)
    cy.clearCookies()
    cy.then(() => login(candidate!.email))
    cy.get('nav:visible').contains('a', 'Minhas verificações').click()
    cy.contains('h1', portuguese.candidate.title).should('be.visible')
    cy.contains('h2', 'Apartamento CRM disponível').should('be.visible')
    cy.get('nav:visible')
      .contains('a', /^Face Check$/)
      .should('not.exist')
    cy.contains('a', portuguese.candidate.start).click()
    cy.location('pathname').should('include', '/pt/face_check/verify/')
    cy.contains('button', 'Começar').should('be.visible')
    cy.clearCookies()
    cy.then(() => login(candidate!.otherEmail))
    cy.visit('/pt/dashboard/face_check/my-verifications?start=next')
    cy.contains(portuguese.candidate.empty).should('be.visible')
    cy.contains('a', portuguese.candidate.start).should('not.exist')
    cy.request({
      url: '/api/face_check/sessions',
      headers: { 'X-Ketris-Api-Version': '3' },
      failOnStatusCode: false,
    })
      .its('status')
      .should('eq', 403)
  })

  it('opens capture directly from the marketplace notification and keeps the menu after submission', () => {
    create(false, true)
    cy.then(() =>
      cy.task<FaceCheckInvitationTestEmail>('readFaceCheckInvitationEmail', candidate!.email),
    ).then((email) => {
      expect(email.captureUrl).to.eq(
        `${Cypress.config('baseUrl')}/pt/face_check/verify/${created!.token}`,
      )
      expect(email.subject).to.contain('Ketris')
      expect(email.html).to.contain('CRM E2E')
      expect(email.text).to.contain(email.captureUrl)
    })
    cy.clearCookies()
    cy.then(() => login(candidate!.email))
    cy.visit('/pt')
    cy.get('button[aria-label="Abrir notificações"]').click()
    cy.contains('button', 'Verificação pendente').should('be.visible').click()
    cy.then(() => cy.location('pathname').should('eq', `/pt/face_check/verify/${created!.token}`))
    cy.contains('button', 'Começar').click()
    cy.get('[role="dialog"]').within(() => {
      cy.contains('label', 'Entendi e estou de acordo!').click()
      cy.contains('button', 'Continuar').click()
    })
    cy.contains('button', 'Seguir sem câmera').click()
    cy.get('input[type="radio"][value="noCamera"]').check()
    cy.then(() => cy.get('input[name="contact"]').type(candidate!.email))
    cy.intercept('POST', '**/api/face_check/capture/*/alternative').as('notificationSubmission')
    cy.contains('button', portuguese.capture.alternative.submit).click()
    cy.wait('@notificationSubmission').its('response.body.status').should('eq', 'REVIEW')
    cy.visit('/pt')
    cy.get('button[aria-label="Abrir notificações"]').click()
    cy.contains('button', 'Verificação pendente').should('not.exist')
    cy.visit('/pt/dashboard/face_check/my-verifications')
    cy.get('nav:visible').contains('a', 'Minhas verificações').should('be.visible')
    cy.contains('Em revisão').should('be.visible')
    cy.contains('a', portuguese.candidate.start).should('not.exist')
  })

  for (const camera of [
    { error: 'NotFoundError', title: 'Nenhuma câmera encontrada neste dispositivo', width: 1440 },
    { error: 'NotAllowedError', title: 'A câmera foi bloqueada', width: 390 },
  ]) {
    it(`requests camera permission after consent and handles ${camera.error}`, () => {
      create()
      cy.clearCookies()
      cy.viewport(camera.width, 844)
      cy.then(() =>
        cy.visit(`/pt/face_check/verify/${created!.token}`, {
          onBeforeLoad(window) {
            const permission = cy
              .stub(window.navigator.mediaDevices, 'getUserMedia')
              .as('cameraPermission')
            permission.rejects(Object.assign(new Error('Test camera'), { name: camera.error }))
          },
        }),
      )
      cy.get('@cameraPermission').should('not.have.been.called')
      cy.contains('button', 'Começar').click()
      cy.get('[role="dialog"]').within(() => {
        cy.contains('label', 'Entendi e estou de acordo!').click()
        cy.contains('button', 'Continuar').click()
      })
      cy.contains('button', 'Ativar câmera').should('be.visible')
      cy.get('@cameraPermission').should('not.have.been.called')
      cy.contains('button', 'Ativar câmera').click()
      cy.get('@cameraPermission').should('have.been.calledOnce')
      cy.contains(camera.title).should('be.visible')
      cy.contains('button', 'Continuar pelo celular').should('be.visible').click()
      cy.get('[role="dialog"]').should('be.visible')
      // The local HTTP test origin cannot be opened safely by a different phone.
      cy.contains('Este endereço não pode ser usado no celular.').should('be.visible')
      cy.get('button[aria-label="Tirar foto"]').should('be.disabled')
      cy.document().then((document) => {
        expect(document.documentElement.scrollWidth).to.be.at.most(
          document.documentElement.clientWidth,
        )
      })
    })
  }

  it('limits agent properties and persists consent and a request for human assistance', () => {
    create(true)
    cy.clearCookies()
    cy.then(() => cy.visit(`/pt/face_check/verify/${created!.token}`))
    cy.contains('button', 'Começar').click()
    cy.get('[role="dialog"]').within(() => {
      cy.contains('em até 7 dias').should('be.visible')
      cy.contains('button', 'Continuar').should('be.disabled')
      cy.contains('label', 'Entendi e estou de acordo!').click()
      cy.intercept('POST', '**/api/face_check/capture/*/consent').as('consent')
      cy.contains('button', 'Continuar').click()
    })
    cy.wait('@consent').then(({ request, response }) => {
      expect(request.body).to.deep.eq({
        accepted: true,
        termsVersion: 'camera-2026-10-31-retention-v1',
      })
      expect(response?.statusCode).to.eq(200)
    })
    cy.contains('button', 'Seguir sem câmera').click()
    cy.get('input[type="radio"][value="noCamera"]').check()
    cy.get('input[name="contact"]').type('face-check@example.test')
    cy.intercept('POST', '**/api/face_check/capture/*/alternative').as('assistance')
    cy.contains('button', portuguese.capture.alternative.submit).click()
    cy.wait('@assistance').its('response.body.status').should('eq', 'REVIEW')
    cy.request('/api/auth/session').its('body').should('not.have.property', 'user')
    cy.then(() => login(fixture!.agentEmail))
    cy.then(() => cy.visit(`/pt/dashboard/face_check/sessions/${created!.id}`))
    cy.contains('Pessoa Teste Face Check').should('be.visible')
    cy.contains('Em revisão').should('be.visible')
  })

  it('shows the mandatory localized privacy modal on a narrow screen before capture', () => {
    create()
    cy.clearCookies()
    cy.viewport(390, 844)
    for (const language of [
      { prefix: 'pt', messages: portuguese },
      { prefix: 'en', messages: english },
      { prefix: 'es', messages: spanish },
    ]) {
      cy.then(() => cy.visit(`/${language.prefix}/face_check/verify/${created!.token}`))
      cy.contains('button', language.messages.capture.consent.start).click()
      cy.get('[role="dialog"]').within(() => {
        cy.contains(language.messages.capture.consent.privacyBody).should('be.visible')
        cy.contains('button', language.messages.capture.consent.continue).should('be.disabled')
        cy.contains('label', language.messages.capture.consent.acknowledgement).click()
        cy.contains('button', language.messages.capture.consent.continue).should('be.enabled')
      })
      cy.document().then((document) => {
        expect(document.documentElement.scrollWidth).to.be.at.most(
          document.documentElement.clientWidth,
        )
      })
    }
  })
})
