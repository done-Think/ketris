import type {
  TeamEvidence,
  TeamFixtureResult,
  TeamInvitationEmail,
} from '../../types/team-fixtures'

const password = 'team-local-e2e-password-123'
let fixture: TeamFixtureResult | null = null
let invitedEmail = ''

function login(email: string, secret = password) {
  cy.visit('/pt/login')
  cy.get('input[name="email"]').type(email)
  cy.get('input[name="password"]').type(secret, { log: false })
  cy.get('button')
    .filter(':visible')
    .contains(/^Entrar$/)
    .click()
  cy.location('pathname', { timeout: 90000 }).should('not.include', '/login')
}

function dialog() {
  return cy.get('[role="dialog"]').filter(':visible').last()
}

function card(name: string) {
  return cy.contains('.broker-card-name', name).closest('.MuiPaper-root')
}

function openAction(name: string, action: string) {
  card(name).find('button[aria-label="Mais opções"]').click()
  cy.contains('[role="menuitem"]', action).click()
}

function evidence() {
  return cy.then(() =>
    cy.task<TeamEvidence>('readTeamEvidence', {
      tenantId: fixture!.tenantIds[0],
      sourceName: fixture!.sourceName,
      destinationName: fixture!.destinationName,
      invitedEmail,
    }),
  )
}

beforeEach(() => {
  cy.viewport(1440, 1000)
  invitedEmail = 'convidado-' + Date.now() + '@team.example.test'
  cy.task<TeamFixtureResult>('seedTeamFixtures', {
    suffix: Date.now() + '-' + Math.floor(Math.random() * 10000),
    password,
  }).then((result) => {
    fixture = result
    login(result.ownerEmail)
    cy.visit('/pt/dashboard/team')
  })
})

afterEach(() => {
  if (fixture) cy.task('cleanupTeamFixtures', fixture.tenantIds)
  fixture = null
})

describe('Equipe de corretores', () => {
  it('mostra os números reais, define meta, transfere e desativa com transferência', () => {
    cy.then(() => {
      card(fixture!.sourceName).within(() => {
        cy.contains('Imóveis').prev().should('have.text', '3')
        cy.contains('Leads em aberto').prev().should('have.text', '2')
        cy.contains('Nenhum retorno').should('be.visible')
        cy.contains('Resposta: 30 min').should('be.visible')
        cy.contains('Sem meta').should('be.visible')
        cy.get('a[aria-label="Enviar mensagem no WhatsApp"]').should(
          'have.attr',
          'href',
          'https://wa.me/5541999991111',
        )
      })
      cy.contains('Corretores ativos').next().should('have.text', '2')

      openAction(fixture!.sourceName, 'Definir meta mensal')
      dialog().find('input[type="number"]').clear().type('5')
      dialog().contains('button', 'Salvar').click()
      cy.contains('Meta mensal atualizada').should('be.visible')
      card(fixture!.sourceName).should('contain', '0/5')
      evidence().its('goal').should('eq', 5)

      openAction(fixture!.sourceName, 'Transferir carteira')
      dialog().find('[role="combobox"]').click()
      cy.contains('[role="option"]', fixture!.destinationName).click()
      dialog().contains('Leads (2)').click()
      dialog().contains('button', 'Transferir').click()
      cy.contains('Transferidos: 0 imóveis, 2 leads, 0 oportunidades e 0 eventos').should(
        'be.visible',
      )
      evidence().should((result) => {
        expect(result.sourceLeads).to.eq(0)
        expect(result.destinationLeads).to.eq(2)
        expect(result.sourceProperties).to.eq(3)
        expect(result.sourceOpportunities).to.eq(1)
      })

      openAction(fixture!.sourceName, 'Desativar corretor')
      dialog().contains('button', 'Transferir e desativar').click()
      dialog().should('contain', 'Selecione o corretor que vai receber a carteira')
      dialog().find('[role="combobox"]').click()
      cy.contains('[role="option"]', fixture!.destinationName).click()
      dialog().contains('button', 'Transferir e desativar').click()
      cy.contains('foi desativado e a carteira foi transferida').should('be.visible')
      card(fixture!.sourceName).should('contain', 'Inativo')
      evidence().should((result) => {
        expect(result.sourceActive).to.eq(false)
        expect(result.sourceProperties).to.eq(0)
        expect(result.destinationProperties).to.eq(3)
        expect(result.sourceOpportunities).to.eq(0)
        expect(result.destinationOpportunities).to.eq(1)
        expect(result.transfers).to.eq(2)
      })
    })
  })

  it('convida um corretor por e-mail e o convidado define a própria senha', function () {
    if (!Cypress.expose('AUTH_MAILBOX_ENABLED')) this.skip()
    cy.contains('button', 'Convidar corretor').click()
    dialog().find('input[name="name"]').type('Eva Convidada')
    dialog().find('input[name="email"]').type(invitedEmail)
    dialog().contains('button', 'Enviar convite').click()
    cy.then(() => cy.contains('Convite enviado para ' + invitedEmail).should('be.visible'))
    card('Eva Convidada').should('contain', 'Convite pendente')
    cy.contains('Corretores ativos').parent().should('contain', '1 convite pendente')

    cy.then(() =>
      cy.task<TeamInvitationEmail>('readTeamInvitationEmail', invitedEmail, { log: false }),
    ).then(({ invitationUrl }) => {
      cy.clearAllCookies()
      cy.visit(new URL(invitationUrl).pathname + new URL(invitationUrl).search)
    })
    cy.contains('Defina sua senha para acessar a Imobiliária Equipe E2E.').should('be.visible')
    cy.get('input[name="password"]').type('nova-senha-do-convite', { log: false })
    cy.get('input[name="passwordConfirmation"]').type('nova-senha-diferente', { log: false })
    cy.contains('button', 'Definir senha').click()
    cy.contains('As senhas não coincidem').should('be.visible')
    cy.get('input[name="passwordConfirmation"]').clear().type('nova-senha-do-convite', {
      log: false,
    })
    cy.contains('button', 'Definir senha').click()
    cy.contains('Senha definida!').should('be.visible')
    evidence().its('invitationAccepted').should('eq', true)

    cy.reload()
    cy.contains('Este convite já foi usado.').should('be.visible')
    login(invitedEmail, 'nova-senha-do-convite')
    cy.location('pathname').should('include', '/dashboard')
  })
})
