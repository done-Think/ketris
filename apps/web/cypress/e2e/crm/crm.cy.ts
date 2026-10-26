import type { CrmEvidence, CrmFixtureResult } from '../../types/crm-fixtures'

const password = 'crm-local-e2e-password-123'
let fixture: CrmFixtureResult | null = null
beforeEach(() => cy.viewport(1440, 1000))
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
function setup(empty = false, agent = false) {
  return cy
    .task<CrmFixtureResult>('seedCrmFixtures', {
      suffix: Date.now() + '-' + Math.floor(Math.random() * 10000),
      password,
      empty,
    })
    .then((result) => {
      fixture = result
      login(agent ? result.agentEmail : result.ownerEmail)
      return cy.wrap(result)
    })
}
function openOpportunity() {
  cy.then(() => {
    cy.visit('/pt/crm/opportunities/' + fixture!.opportunityId)
  })
  cy.contains('button', 'Editar dados').should('be.visible')
}
afterEach(() => {
  if (fixture) cy.task('cleanupCrmFixtures', [fixture.tenantId, fixture.foreignTenantId])
  fixture = null
})

describe('CRM real workflows', () => {
  it('mantém listas vazias sem registros fictícios', () => {
    setup(true)
    cy.intercept('GET', '**/api/crm/leads*').as('leads')
    cy.visit('/pt/dashboard/leads')
    cy.wait('@leads').its('response.body.pagination.totalCount').should('eq', 0)
    cy.get('table[aria-label="Leads do CRM"]').should('not.exist')
    cy.intercept('GET', '**/api/crm/contacts*').as('contacts')
    cy.visit('/pt/crm/contacts')
    cy.wait('@contacts').its('response.body.contacts').should('have.length', 0)
    cy.contains('Ricardo Mendes').should('not.exist')
  })

  it('pagina e busca leads além da primeira página no servidor', () => {
    setup()
    cy.intercept('GET', '**/api/crm/leads*').as('leads')
    cy.visit('/pt/dashboard/leads')
    cy.wait('@leads').then(({ response }) => {
      expect(response?.body.leads).to.have.length(5)
      expect(response?.body.pagination.totalCount).to.eq(6)
    })
    cy.get('button[aria-label="Go to next page"]').filter(':visible').click()
    cy.wait('@leads').its('request.url').should('include', 'page=2')
    cy.get('table').contains('Lead CRM Último').should('be.visible')
    cy.get('input[aria-label="Buscar leads"]').type('Último')
    cy.wait('@leads').its('request.url').should('include', 'page=1')
    cy.get('table').contains('Lead CRM Último').should('be.visible')
  })

  it('carrega mais cartões no Kanban mantendo a contagem global', () => {
    setup()
    cy.visit('/pt/crm')
    cy.get('[aria-labelledby="sales-pipeline-stage-prospecting"]').within(() => {
      cy.get('a').should('have.length', 5)
      cy.contains('button', 'Carregar mais').click()
      cy.get('a').should('have.length', 7)
      cy.contains('button', 'Carregar mais').should('not.exist')
    })
  })

  it('cadastra orçamento livre e exige e-mail real ao converter um lead', () => {
    setup(true)
    cy.visit('/pt/dashboard/leads')
    cy.contains('button', 'Novo Lead').click()
    cy.get('input[name="name"]').type('Novo lead sem e-mail')
    cy.get('input[name="phone"]').type('11999999999')
    cy.contains('button', 'Próximo').click()
    cy.get('input[name="interest"]').type('Apartamento')
    cy.get('input[name="budget"]').type('Até R$ 2.000,45, a negociar')
    cy.contains('button', 'Próximo').click()
    cy.intercept('POST', '**/api/crm/leads').as('createLead')
    cy.contains('button', 'Criar lead').click()
    cy.wait('@createLead').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(201)
      expect(request.body).not.to.have.property('activeStepIndex')
      expect(response?.body.lead.budget).to.eq('Até R$ 2.000,45, a negociar')
    })
    cy.get('table').contains('tr', 'Novo lead sem e-mail').contains('button', 'Contato').click()
    cy.contains('button', 'Converter em oportunidade').click()
    cy.contains('button', /^Converter$/).should('be.disabled')
    cy.get('input[type="email"]').type('lead-convertido@crm.example.test')
    cy.get('input[role="combobox"]').type('Apartamento CRM')
    cy.contains('[role="option"]', 'Apartamento CRM não publicado').click()
    cy.get('input[type="number"]').clear().type('2300.45')
    cy.intercept('POST', '**/api/crm/leads/*/convert').as('convert')
    cy.contains('button', /^Converter$/).click()
    cy.wait('@convert').then(({ response }) => {
      expect(response?.statusCode).to.eq(200)
      expect(response?.body.lead.email).to.eq('lead-convertido@crm.example.test')
      cy.visit('/pt/crm/opportunities/' + response?.body.opportunityId)
    })
    cy.contains('Apartamento CRM não publicado').should('be.visible')
  })

  it('salva centavos e condições com vírgulas e quebras de linha sem perda', () => {
    setup()
    openOpportunity()
    cy.contains('button', 'Editar dados').click()
    cy.get('input[name="proposedValue"]').clear().type('2100.45')
    cy.contains('button', 'Adicionar condição').click()
    cy.get('textarea[name="specialConditions.0.text"]').type(
      'Pets, mediante vistoria{enter}Conferir na entrega',
    )
    cy.intercept('PATCH', '**/api/crm/opportunities/*').as('update')
    cy.contains('button', 'Salvar alterações').click()
    cy.wait('@update').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200)
      expect(response?.body.opportunity.proposedValue).to.eq(2100.45)
      expect(request.body.specialConditions).to.deep.eq([
        'Pets, mediante vistoria\nConferir na entrega',
      ])
    })
  })

  it('sincroniza o contato ao editar a oportunidade e registra a autoria', () => {
    setup()
    openOpportunity()
    cy.contains('button', 'Editar dados').click()
    cy.get('input[name="leadName"]').clear().type('Contato CRM atualizado')
    cy.get('input[name="leadEmail"]').clear().type('contato-atualizado@crm.example.test')
    cy.intercept('PATCH', '**/api/crm/opportunities/*').as('update')
    cy.contains('button', 'Salvar alterações').click()
    cy.wait('@update').its('response.statusCode').should('eq', 200)
    cy.then(() =>
      cy.task<CrmEvidence>('readCrmEvidence', {
        tenantId: fixture!.tenantId,
        contactId: fixture!.contactId,
      }),
    ).then((evidence) => {
      expect(evidence.contact?.name).to.eq('Contato CRM atualizado')
      expect(evidence.opportunities).to.have.length(2)
      expect(
        evidence.opportunities.every(
          (item) => item.leadEmail === 'contato-atualizado@crm.example.test',
        ),
      ).to.eq(true)
      expect(
        evidence.audits.some((event) => event.actorUserId && event.entityType === 'CONTACT'),
      ).to.eq(true)
    })
  })

  it('recusa detalhe de outra imobiliária para o corretor autenticado', () => {
    setup(false, true).then((result) => {
      cy.intercept('GET', '**/api/crm/opportunities/' + result.foreignOpportunityId).as('foreign')
      cy.visit('/pt/crm/opportunities/' + result.foreignOpportunityId)
      cy.wait('@foreign').its('response.statusCode').should('eq', 404)
      cy.contains('Pessoa de outra imobiliária').should('not.exist')
    })
  })
  it('preserva a preferência de visualização sem erro de hidratação', () => {
    setup()
    cy.visit('/pt/crm')
    cy.get('button[aria-label="Ver em lista"]').click()
    cy.get('table').should('be.visible')
    cy.reload()
    cy.get('button[aria-label="Ver em lista"]').should('have.attr', 'aria-pressed', 'true')
    cy.get('table').should('be.visible')
  })
  it('mantém visível o contato criado pelo próprio corretor sem oportunidade', () => {
    setup(false, true)
    cy.visit('/pt/crm/contacts')
    cy.contains('button', 'Novo Contato').click()
    cy.get('input[name="name"]').type('Contato novo do corretor')
    cy.get('input[name="email"]').type('contato-proprio@crm.example.test')
    cy.intercept('POST', '**/api/crm/contacts').as('createContact')
    cy.contains('button', /^Salvar$/).click()
    cy.wait('@createContact').its('response.statusCode').should('eq', 201)
    cy.get('[role="dialog"]').should('not.exist')
    cy.intercept('GET', '**/api/crm/contacts*', (request) => {
      if (request.query.q === 'Contato novo do corretor') request.alias = 'ownContact'
    })
    cy.get('input[aria-label="Buscar contatos"]').type('Contato novo do corretor')
    cy.wait('@ownContact').its('response.body.contacts').should('have.length', 1)
    cy.get('table').contains('Contato novo do corretor').should('be.visible')
  })
})
