// E2E do fluxo crítico de login (constitution.md III). Testa no nível de API (`cy.request`) contra a
// rota real /api/auth/login, rodando com o app de pé (`npm run dev`/`build+start`) e Postgres migrado —
// a UI em /login ainda é um placeholder (ver src/app/(auth)/login/page.tsx), então não há formulário para
// dirigir via cy.visit()/cy.get() ainda. Quando o formulário for implementado, este spec ganha um
// complemento que dirige a UI e mantém este bloco como cobertura de contrato da API.
describe('Login (API)', () => {
  const tenantSlug = `e2e-tenant-${Date.now()}`
  const email = `e2e-login-${Date.now()}@ketris.dev`
  const password = 'senha-correta-123'
  let tenantId: string

  before(() => {
    cy.task('seedAuthUser', { email, password, tenantSlug }).then((id) => {
      tenantId = id as string
    })
  })

  after(() => {
    cy.task('cleanupAuthUser', tenantId)
  })

  it('autentica com credenciais válidas e retorna usuário + access token', () => {
    cy.request('POST', '/api/auth/login', { email, password }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.user.email).to.eq(email)
      expect(response.body.user).to.not.have.property('senhaHash')
      expect(response.body.accessToken).to.be.a('string')
    })
  })

  it('retorna 401 com senha incorreta (mensagem genérica, anti-enumeração)', () => {
    cy.request({
      method: 'POST',
      url: '/api/auth/login',
      body: { email, password: 'senha-errada' },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.error.code).to.eq('INVALID_CREDENTIALS')
    })
  })

  it('retorna 401 com e-mail inexistente (mesma mensagem genérica)', () => {
    cy.request({
      method: 'POST',
      url: '/api/auth/login',
      body: { email: 'nao-existe@ketris.dev', password },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.error.code).to.eq('INVALID_CREDENTIALS')
    })
  })

  it('retorna 400 quando o corpo falha na validação Zod', () => {
    cy.request({
      method: 'POST',
      url: '/api/auth/login',
      body: { email: 'nao-e-email', password: '' },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.error.code).to.eq('VALIDATION_ERROR')
    })
  })

  it('publica o contrato do endpoint em /api/docs/openapi.json', () => {
    cy.request('/api/docs/openapi.json').then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.paths).to.have.property('/auth/login')
    })
  })
})
