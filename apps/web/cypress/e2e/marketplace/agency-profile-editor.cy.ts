import type { AuthTestEmail } from '../../types/auth-mailbox'

describe('Agency public profile defaults', () => {
  const suffix = Date.now()
  const email = `agency-profile-${suffix}@example.test`
  const publicEmail = `agency-contact-${suffix}@example.test`
  const password = 'Agency-profile-e2e-password-123'
  let tenantId: string
  let avatarUrl: string
  let registeredTenantId: string

  before(() => {
    cy.task<string>('seedAuthUser', {
      email,
      password,
      tenantSlug: `agency-profile-${suffix}`,
    }).then((id) => {
      tenantId = id
    })
    cy.request({
      method: 'POST',
      url: '/api/auth/login',
      body: { email, password },
      log: false,
    }).then(({ body }) => {
      avatarUrl = `/api/auth/media/avatars/${tenantId}/${body.user.id}/company.png`
      return cy.request({
        method: 'PATCH',
        url: `/api/auth/users/${body.user.id}`,
        headers: { Authorization: `Bearer ${body.accessToken}` },
        body: { phone: '35997989991', avatarUrl },
        log: false,
      })
    })
  })

  after(() => {
    if (tenantId) cy.task('cleanupAuthUser', tenantId)
    if (registeredTenantId) cy.task('cleanupAuthUser', registeredTenantId)
  })

  it('prefills the verified contact and photo, masks the phone and preserves edited public data', () => {
    cy.intercept('GET', `**${avatarUrl}`, {
      fixture: 'property.png',
      headers: { 'Content-Type': 'image/png' },
    })
    cy.visit('/pt/login?callbackUrl=/dashboard/public-profile/agency')
    cy.get('input[name="email"]').type(email)
    cy.get('input[name="password"]').type(password, { log: false })
    cy.contains('button', 'Entrar').click()
    cy.location('pathname').should('eq', '/pt/dashboard/public-profile/agency')

    cy.get('input[name="displayName"]').should('have.value', 'Tenant E2E')
    cy.get('input[name="email"]').should('have.value', email)
    cy.get('input[name="phone"]').should('have.value', '(35) 99798-9991')
    cy.contains('p', /^URL do logo$/)
      .parent()
      .find('img')
      .should('have.attr', 'src', avatarUrl)

    cy.contains('button', /^Editar$/).click()
    cy.get('input[name="phone"]').clear().type('3536221234').should('have.value', '(35) 3622-1234')
    cy.get('input[name="email"]').clear().type(publicEmail)
    cy.intercept('PUT', '**/api/marketplace/profiles/agency').as('saveProfile')
    cy.contains('button', /^Salvar$/).click()
    cy.wait('@saveProfile').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200)
      expect(request.body).to.include({
        email: publicEmail,
        phone: '(35) 3622-1234',
        logoUrl: avatarUrl,
      })
    })
    cy.reload()
    cy.get('input[name="email"]').should('have.value', publicEmail)
    cy.get('input[name="phone"]').should('have.value', '(35) 3622-1234')
    cy.contains('p', /^URL do logo$/)
      .parent()
      .find('img')
      .should('have.attr', 'src', avatarUrl)
  })

  const itWithMailbox = Cypress.expose('AUTH_MAILBOX_ENABLED') ? it : it.skip
  itWithMailbox(
    'retains the CRECI entered at agency signup through verification and public profile saving',
    () => {
      const signupEmail = `agency-signup-${suffix}@example.test`
      const creci = 'MG-54321-J'
      cy.intercept('POST', '**/api/register').as('registerAgency')
      cy.visit('/pt/register/details?profile=agency')
      cy.get('input[name="fullName"]').type('Gestora da Imobiliária')
      cy.get('input[name="companyName"]').type('Imobiliária Nova')
      cy.get('input[name="email"]').type(signupEmail)
      cy.get('input[name="phone"]').type('35997989991')
      cy.get('input[name="creci"]').type(creci)
      cy.get('input[name="password"]').type(password, { log: false })
      cy.get('input[name="passwordConfirmation"]').type(password, { log: false })
      cy.get('input[name="acceptTerms"]').check()
      cy.contains('button', 'Criar conta').click()
      cy.wait('@registerAgency').then(({ request, response }) => {
        expect(request.body.creci).to.eq(creci)
        expect(response?.statusCode).to.eq(201)
        registeredTenantId = response?.body.tenantId
      })
      cy.contains('Confirme seu e-mail').should('be.visible')
      cy.task<AuthTestEmail>('readAuthEmail', signupEmail, { log: false }).then(({ code }) => {
        cy.get('input[autocomplete="one-time-code"]')
          .closest('[role="group"]')
          .find('input')
          .each(($input, index) => {
            cy.wrap($input, { log: false }).type(`{selectall}${code[index]}`, { log: false })
          })
        cy.contains('button', /^Confirmar$/).click()
      })
      cy.location('pathname').should('eq', '/pt/dashboard')
      cy.visit('/pt/dashboard/public-profile/agency')
      cy.get('input[name="legalCreci"]').should('have.value', creci)
      cy.contains('button', /^Editar$/).click()
      cy.intercept('PUT', '**/api/marketplace/profiles/agency').as('saveRegisteredProfile')
      cy.contains('button', /^Salvar$/).click()
      cy.wait('@saveRegisteredProfile').then(({ request, response }) => {
        expect(request.body.legalCreci).to.eq(creci)
        expect(response?.statusCode).to.eq(200)
      })
      cy.reload()
      cy.get('input[name="legalCreci"]').should('have.value', creci)
    },
  )

  it('saves all three agency colors, opens the picker below the field and publishes without a team', () => {
    const displayName = `Agency without brokers ${suffix}`
    cy.request({
      method: 'POST',
      url: '/api/auth/login',
      body: { email, password },
      log: false,
    }).then(({ body }) =>
      cy.request({
        method: 'PUT',
        url: '/api/marketplace/profiles/agency',
        headers: { Authorization: `Bearer ${body.accessToken}` },
        body: {
          displayName,
          headline: 'Sua nova imobiliária',
          summary: 'Imobiliária sem corretores.',
          legalCreci: 'MG-12345',
          headquarters: 'Itajubá',
          address: 'Rua Principal, 35',
          email,
          coverage: ['Itajubá'],
          segments: ['Residencial'],
          yearsInMarket: 0,
          backgroundColor: '#ffffff',
          primaryColor: '#112233',
          secondaryColor: '#445566',
          logoUrl: avatarUrl,
          bannerUrl: avatarUrl,
          team: [],
        },
        log: false,
      }),
    )
    cy.intercept('GET', `**${avatarUrl}`, {
      fixture: 'property.png',
      headers: { 'Content-Type': 'image/png' },
    })
    cy.visit('/pt/login?callbackUrl=/dashboard/public-profile/agency')
    cy.get('input[name="email"]').type(email)
    cy.get('input[name="password"]').type(password, { log: false })
    cy.contains('button', 'Entrar').click()
    cy.location('pathname').should('eq', '/pt/dashboard/public-profile/agency')
    cy.contains('button', /^Editar$/).click()
    for (const [name, color] of Object.entries({
      primaryColor: '#123456',
      secondaryColor: '#654321',
      backgroundColor: '#fedcba',
    })) {
      cy.get(`input[name="${name}"]`)
        .should('have.attr', 'type', 'color')
        .then(($input) => {
          const input = $input[0] as HTMLInputElement
          const view = input.ownerDocument.defaultView!
          Object.getOwnPropertyDescriptor(view.HTMLInputElement.prototype, 'value')!.set!.call(
            input,
            color,
          )
          input.dispatchEvent(new view.Event('input', { bubbles: true }))
          input.dispatchEvent(new view.Event('change', { bubbles: true }))
        })
    }
    cy.contains(
      'Opcional. Você pode publicar sem corretores em destaque e adicioná-los depois.',
    ).should('exist')

    for (const [width, height] of [
      [1280, 900],
      [375, 812],
    ]) {
      cy.viewport(width, height)
      cy.get('input[role="combobox"]').scrollIntoView().click()
      cy.get('.MuiAutocomplete-popper').should('have.attr', 'data-popper-placement', 'bottom-start')
      cy.get('input[role="combobox"]').then(($input) => {
        cy.get('.MuiAutocomplete-popper').should(($popup) => {
          expect($popup[0].getBoundingClientRect().top).to.be.at.least(
            $input[0].getBoundingClientRect().bottom,
          )
        })
      })
      cy.get('input[role="combobox"]').type('{esc}')
    }
    cy.viewport(1280, 900)
    cy.intercept('POST', '**/api/marketplace/profiles/agency/publish').as('publishProfile')
    cy.intercept('PUT', '**/api/marketplace/profiles/agency').as('saveColors')
    cy.contains('button', /^Publicar$/).click()
    cy.wait('@saveColors').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200)
      expect(request.body).to.include({
        primaryColor: '#123456',
        secondaryColor: '#654321',
        backgroundColor: '#fedcba',
      })
    })
    cy.wait('@publishProfile').then(({ response }) => {
      expect(response?.statusCode).to.eq(200)
      expect(response?.body.profile.team).to.deep.eq([])
      expect(response?.body.profile.yearsInMarket).to.eq(0)
      expect(response?.body.profile).to.include({
        primaryColor: '#123456',
        secondaryColor: '#654321',
        backgroundColor: '#fedcba',
      })
    })
    cy.reload()
    cy.get('input[name="primaryColor"]').should('have.value', '#123456')
    cy.get('input[name="secondaryColor"]').should('have.value', '#654321')
    cy.get('input[name="backgroundColor"]').should('have.value', '#fedcba')
    cy.visit(`/pt/imobiliarias/${tenantId}`)
    cy.get('h1').should('contain', displayName)
    cy.contains('h5', 'Equipe em destaque').should('not.exist')
  })
})
