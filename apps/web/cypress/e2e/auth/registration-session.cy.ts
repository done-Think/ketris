import type { AuthTestEmail } from '../../types/auth-mailbox'

function enterVerificationCode(code: string) {
  cy.get('input[autocomplete="one-time-code"]')
    .closest('[role="group"]')
    .find('input')
    .each(($input, index) => {
      cy.wrap($input, { log: false }).type(`{selectall}${code[index]}`, { log: false })
    })
}

const describeWithMailbox = Cypress.env('AUTH_MAILBOX_ENABLED') ? describe : describe.skip

describeWithMailbox('Auth — cadastro, sessão e prova real de e-mail', () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const password = 'senha-somente-e2e-123'
  const email = `signup-${suffix}@auth.example.test`
  const multiEmail = `multi-${suffix}@auth.example.test`
  const tenants: string[] = []

  after(() => {
    tenants.forEach((tenantId) => cy.task('cleanupAuthUser', tenantId, { log: false }))
  })

  it('cadastra sem sessão antecipada, rejeita código incorreto e entra após comprovar o e-mail', () => {
    cy.intercept('POST', '**/api/register').as('register')
    cy.visit('/pt/register/details?profile=proprietario')
    cy.get('input[name="fullName"]').type('Proprietária E2E')
    cy.get('input[name="email"]').type(email)
    cy.get('input[name="phone"]').type('11999999999')
    cy.get('input[name="password"]').type(password, { log: false })
    cy.get('input[name="passwordConfirmation"]').type(password, { log: false })
    cy.get('input[name="acceptTerms"]').check()
    cy.contains('button', 'Criar conta').click()
    cy.wait('@register').then(({ response }) => {
      expect(response?.statusCode).to.eq(201)
      expect(response?.body.outcome).to.eq('PENDING_EMAIL_VERIFICATION')
      expect(response?.body.emailSent).to.eq(true)
      expect(response?.body).not.to.have.property('accessToken')
      tenants.push(response?.body.tenantId)
    })
    cy.contains('Confirme seu e-mail').should('be.visible')
    cy.contains('Confirmar depois').should('not.exist')
    cy.getCookie('next-auth.session-token', { log: false }).should('be.null')
    cy.task<AuthTestEmail>('readAuthEmail', email, { log: false }).then(({ code }) => {
      enterVerificationCode(code === '000000' ? '000001' : '000000')
      cy.contains('button', /^Confirmar$/).click()
      cy.contains('Código inválido, expirado').should('be.visible')
      cy.getCookie('next-auth.session-token', { log: false }).should('be.null')
      enterVerificationCode(code)
      cy.contains('button', /^Confirmar$/).click()
    })
    cy.location('pathname', { timeout: 90000 }).should('eq', '/pt/dashboard')
    cy.request({ url: '/api/auth/session', log: false }).then(({ body }) => {
      expect(body.scope).to.eq('tenant')
      expect(body.user.email).to.eq(email)
      cy.request({
        url: `/api/auth/users/${body.user.id}`,
        headers: { Authorization: `Bearer ${body.accessToken}` },
        log: false,
      }).then(({ body: profile }) => {
        expect(profile.user.phone).to.eq('(11) 99999-9999')
      })
    })
  })

  it('valida credenciais antes de oferecer contas e estabelece sessão na imobiliária escolhida', () => {
    const loginTenants: string[] = []
    cy.task<string>(
      'seedAuthUser',
      { email: multiEmail, password, tenantSlug: `auth-first-${suffix}` },
      { log: false },
    ).then((id) => {
      tenants.push(id)
      loginTenants.push(id)
    })
    cy.task<string>(
      'seedAuthUser',
      { email: multiEmail, password, tenantSlug: `auth-second-${suffix}` },
      { log: false },
    ).then((id) => {
      tenants.push(id)
      loginTenants.push(id)
    })
    cy.intercept('POST', '**/api/auth/login').as('login')
    cy.visit('/pt/login')
    cy.get('input[name="email"]').type(multiEmail)
    cy.get('input[name="password"]').type(password, { log: false })
    cy.contains('button', /^Entrar$/).click()
    cy.wait('@login').then(({ response }) => {
      expect(response?.body.outcome).to.eq('SELECT_TENANT')
      expect(response?.body.tenants).to.have.length(2)
      expect(response?.body).not.to.have.property('accessToken')
    })
    cy.getCookie('next-auth.session-token', { log: false }).should('be.null')
    cy.get('[role="combobox"]').click()
    cy.get('[role="option"]:not([aria-disabled="true"])').first().click()
    cy.contains('button', /^Entrar$/).click()
    cy.location('pathname').should('eq', '/pt/dashboard')
    cy.request({ url: '/api/auth/session', log: false }).then(({ body }) => {
      expect(body.scope).to.eq('tenant')
      expect(loginTenants).to.include(body.tenantId)
    })
  })

  it('só revela contas após o código e redefine a senha apenas na conta escolhida', () => {
    const recoveryEmail = `recover-${suffix}@auth.example.test`
    cy.task<string>(
      'seedAuthUser',
      { email: recoveryEmail, password, tenantSlug: `auth-recover-first-${suffix}` },
      { log: false },
    ).then((id) => tenants.push(id))
    cy.task<string>(
      'seedAuthUser',
      { email: recoveryEmail, password, tenantSlug: `auth-recover-second-${suffix}` },
      { log: false },
    ).then((id) => tenants.push(id))
    const newPassword = 'nova-senha-somente-e2e-123'
    let selectedTenant: string
    cy.intercept('POST', '**/api/auth/password-reset-codes/verify').as('verifyRecovery')
    cy.visit('/pt/forgot-password')
    cy.get('input[name="email"]').type(recoveryEmail)
    cy.contains('button', 'Enviar código').click()
    cy.contains('Verifique seu e-mail').should('be.visible')
    cy.get('[role="combobox"]').should('not.exist')
    cy.task<AuthTestEmail>('readAuthEmail', recoveryEmail, { log: false }).then(({ code }) => {
      enterVerificationCode(code)
    })
    cy.wait('@verifyRecovery').then(({ response }) => {
      expect(response?.body.outcome).to.eq('SELECT_TENANT')
      expect(response?.body.tenants).to.have.length(2)
      selectedTenant = response?.body.tenants[0].id
    })
    cy.contains('Escolha sua conta').should('be.visible')
    cy.get('[role="combobox"]').click()
    cy.get('[role="option"]:not([aria-disabled="true"])').first().click()
    cy.contains('button', 'Continuar').click()
    cy.contains('Crie uma nova senha').should('be.visible')
    cy.get('input[name="password"]').type(newPassword, { log: false })
    cy.get('input[name="passwordConfirmation"]').type(newPassword, { log: false })
    cy.get('form').submit()
    cy.contains('Senha redefinida!').should('be.visible')
    cy.request({
      method: 'POST',
      url: '/api/auth/login',
      body: { email: recoveryEmail, password: newPassword },
      log: false,
    }).then(({ body }) => {
      expect(body.user.tenantId).to.eq(selectedTenant)
    })
    cy.request({
      method: 'POST',
      url: '/api/auth/login',
      body: { email: recoveryEmail, password },
      log: false,
    }).then(({ body }) => {
      expect(body.user.tenantId).not.to.eq(selectedTenant)
    })
  })

  it('permite confirmação pública de e-mail iniciada pela gestão sem criar sessão para o destinatário', () => {
    const managerEmail = `manager-${suffix}@auth.example.test`
    cy.task<string>(
      'seedAuthUser',
      { email: managerEmail, password, tenantSlug: `auth-manager-${suffix}` },
      { log: false },
    ).then((id) => tenants.push(id))
    const oldEmail = `managed-${suffix}@auth.example.test`
    const newEmail = `changed-${suffix}@auth.example.test`
    let targetId: string
    cy.request({
      method: 'POST',
      url: '/api/auth/login',
      body: { email: managerEmail, password },
      log: false,
    }).then(({ body }) => {
      const headers = { Authorization: `Bearer ${body.accessToken}` }
      cy.request({
        method: 'POST',
        url: '/api/auth/users',
        headers,
        body: { name: 'Conta gerida', email: oldEmail, password, role: 'PROPERTY_OWNER' },
        log: false,
      }).then(({ body: created }) => {
        targetId = created.user.id
        cy.request({
          method: 'POST',
          url: `/api/auth/users/${targetId}/email-change`,
          headers,
          body: { email: newEmail, locale: 'pt-BR' },
          log: false,
        })
      })
    })
    cy.task<AuthTestEmail>('readAuthEmail', newEmail, { log: false }).then(
      ({ code, confirmationUrl }) => {
        expect(confirmationUrl).to.be.a('string')
        cy.visit(confirmationUrl!)
        cy.get('input[autocomplete="one-time-code"]').click()
        cy.viewport(390, 844)
        enterVerificationCode(code)
        cy.contains('button', 'Confirmar novo e-mail').click()
        cy.contains('E-mail confirmado. Para acessar esta conta novamente').should('be.visible')
      },
    )
    cy.getCookie('next-auth.session-token', { log: false }).should('be.null')
    cy.request({
      method: 'POST',
      url: '/api/auth/login',
      body: { email: oldEmail, password },
      failOnStatusCode: false,
      log: false,
    })
      .its('status')
      .should('eq', 401)
    cy.request({
      method: 'POST',
      url: '/api/auth/login',
      body: { email: newEmail, password },
      log: false,
    }).then(({ body }) => {
      expect(body.user.id).to.eq(targetId)
    })
  })
})
