describe('Agency public profile defaults', () => {
  const suffix = Date.now()
  const email = `agency-profile-${suffix}@example.test`
  const publicEmail = `agency-contact-${suffix}@example.test`
  const password = 'Agency-profile-e2e-password-123'
  let tenantId: string
  let avatarUrl: string

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
})
