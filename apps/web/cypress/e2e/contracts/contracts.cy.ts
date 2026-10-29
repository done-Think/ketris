import type {
  ContractEvidenceResult,
  ContractFixtureSeedResult,
} from '../../types/contracts-fixtures'

const password = 'contracts-local-e2e-password-123'
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
function createContract(data: ContractFixtureSeedResult) {
  cy.intercept('POST', '**/api/contracts').as('createContract')
  cy.visit('/pt/dashboard/contracts')
  cy.contains('button', /Novo Contrato/i).click()
  cy.get('input[role="combobox"]').type(data.leadName)
  cy.contains('[role="option"]', data.leadName).click()
  cy.contains('button', 'Próximo passo').click()
  cy.get('input[name="ownerName"]').should('have.value', data.ownerName)
  cy.get('input[name="tenantEmail"]').should('have.value', data.renterEmail)
  cy.get('input[name="ownerCpf"]').type('52998224725')
  cy.get('input[name="tenantCpf"]').type('98765432100')
  cy.contains('button', 'Próximo passo').click()
  cy.get('input[name="amount"]').clear().type('2300.45')
  cy.get('input[name="dueDay"]').type('05')
  cy.get('input[name="startDate"]').type('01012031')
  cy.get('input[name="endDate"]').type('01012032')
  cy.get('input[name="guaranteeType"]').parent().click()
  cy.contains('[role="option"]', /^Caução$/).click()
  cy.get('input[name="adjustmentIndex"]').parent().click()
  cy.contains('[role="option"]', /^IPCA$/).click()
  cy.contains('button', 'Próximo passo').click()
  cy.contains('2.300,45').should('be.visible')
  cy.contains('button', 'Gerar contrato').click()
  return cy.wait('@createContract').then(({ response }) => {
    expect(response?.statusCode).to.eq(201)
    expect(response?.body.contract.amount).to.eq(2300.45)
    return response?.body.contract.id as string
  })
}
function upload(name: string) {
  cy.intercept('POST', '**/api/contracts/*/documents').as('confirmDocument')
  cy.get('input[type="file"]').selectFile({
    contents: Cypress.Buffer.from('%PDF-1.7\n' + name + '\n%%EOF'),
    fileName: name,
    mimeType: 'application/pdf',
  })
  cy.contains('button', 'Enviar PDF').click()
  cy.wait('@confirmDocument').then(({ response }) => {
    expect(response?.statusCode).to.eq(200)
    expect(response?.body.document.sha256).to.match(/^[a-f0-9]{64}$/)
    expect(response?.body.document.canDownload).to.eq(true)
    expect(response?.body.document).not.to.have.property('objectKey')
  })
}
function registerSignature() {
  cy.contains('button', 'Registrar assinatura manual').click()
  cy.get('[role="dialog"]').within(() => {
    cy.contains('Este é um registro manual').should('be.visible')
    cy.get('[role="combobox"]').click()
  })
  cy.contains('[role="option"]', 'Atualizado.pdf').click()
  cy.get('[role="dialog"]').contains('button', 'Confirmar registro manual').click()
  return cy.wait('@signContract')
}

describe('Contracts — fluxos reais com documentos privados', () => {
  let fixtures: ContractFixtureSeedResult | undefined
  beforeEach(() => {
    cy.task<ContractFixtureSeedResult>(
      'seedContractFixtures',
      {
        suffix: Date.now() + '-' + Math.random().toString(36).slice(2, 8),
        password,
      },
      { log: false },
    ).then((data) => {
      fixtures = data
    })
  })
  afterEach(() => {
    if (fixtures) cy.task('cleanupContractFixtures', fixtures.tenantIds, { log: false })
    fixtures = undefined
  })

  it('cria, edita, exige PDF atualizado, registra assinaturas manuais e encerra preservando o financeiro', () => {
    const data = fixtures!
    expect(Cypress.expose('CONTRACTS_STORAGE_ENABLED')).to.eq(true)
    login(data.ownerEmail)
    createContract(data).then((contractId) => {
      cy.intercept('PATCH', '**/api/contracts/' + contractId).as('editContract')
      cy.intercept('POST', '**/api/contracts/' + contractId + '/parties/*/sign').as('signContract')
      cy.intercept('POST', '**/api/contracts/' + contractId + '/close').as('closeContract')
      cy.visit('/pt/dashboard/contracts/' + contractId)
      cy.contains('Dados do contrato').should('be.visible')
      upload('Original.pdf')
      cy.contains('button', 'Editar').click()
      cy.get('[role="dialog"]').find('input[name="amount"]').clear().type('1800.25')
      cy.get('[role="dialog"]').contains('button', 'Salvar alterações').click()
      cy.wait('@editContract').its('response.body.contract.dataRevision').should('eq', 1)
      cy.contains('Versão anterior: envie um novo PDF').should('be.visible')
      cy.contains('button', 'Registrar assinatura manual').first().click()
      cy.get('[role="dialog"]').contains('Envie um PDF para a revisão atual').should('be.visible')
      cy.get('[role="dialog"]')
        .contains('button', 'Confirmar registro manual')
        .should('be.disabled')
      cy.get('[role="dialog"]').contains('button', 'Voltar').click()
      upload('Atualizado.pdf')
      registerSignature().its('response.statusCode').should('eq', 200)
      cy.contains('button', 'Editar').should('not.exist')
      registerSignature().its('response.body.contract.status').should('eq', 'ACTIVE')
      cy.contains('Registro manual').should('be.visible')
      cy.contains('button', 'Encerrar contrato').click()
      cy.get('[role="dialog"]').find('textarea[name="reason"]').type('Locação concluída no teste')
      cy.get('[role="dialog"]').contains('button', 'Confirmar').click()
      cy.wait('@closeContract').its('response.body.contract.status').should('eq', 'CLOSED')
      cy.contains('Contrato encerrado').should('be.visible')
      cy.task<ContractEvidenceResult>('readContractEvidence', contractId, { log: false }).then(
        (result) => {
          expect(result).to.include({
            status: 'CLOSED',
            propertyStatus: 'INACTIVE',
            chargeCount: 1,
            protectedCpfs: true,
          })
          expect(result.signatures).to.have.length(2)
          result.signatures.forEach((signature) => {
            expect(signature.method).to.eq('MANUAL')
            expect(signature.author).to.eq(data.ownerId)
            expect(signature.hash).to.match(/^[a-f0-9]{64}$/)
          })
          expect(result.actions).to.include.members([
            'CREATED',
            'UPDATED',
            'DOCUMENT_UPLOADED',
            'MANUAL_SIGNATURE_REGISTERED',
            'CLOSED',
          ])
        },
      )
    })
  })

  it('pagina no servidor e cancela um contrato ainda não ativo com motivo obrigatório', () => {
    const data = fixtures!
    cy.intercept('GET', '**/api/contracts?*', (request) => {
      if (Number(request.query.page) === 2) request.alias = 'contractsPage2'
    })
    login(data.ownerEmail)
    cy.visit('/pt/dashboard/contracts')
    cy.get('button[aria-label="Próxima página"]').click()
    cy.wait('@contractsPage2').then(({ response }) => {
      expect(response?.body.items).to.have.length(5)
      expect(response?.body.totalCount).to.eq(26)
      expect(response?.body.summary.total).to.eq(26)
    })
    createContract(data).then((contractId) => {
      cy.intercept('POST', '**/api/contracts/' + contractId + '/cancel').as('cancelContract')
      cy.visit('/pt/dashboard/contracts/' + contractId)
      cy.contains('button', 'Cancelar contrato').click()
      cy.get('[role="dialog"]').contains('button', 'Confirmar').click()
      cy.contains('Informe o motivo.').should('be.visible')
      cy.get('[role="dialog"]').find('textarea[name="reason"]').type('Proposta cancelada')
      cy.get('[role="dialog"]').contains('button', 'Confirmar').click()
      cy.wait('@cancelContract').then(({ response }) => {
        expect(response?.statusCode).to.eq(200)
        expect(response?.body.contract.status).to.eq('CANCELED')
        expect(response?.body.contract.cancellationReason).to.eq('Proposta cancelada')
      })
      cy.contains('Contrato cancelado').should('be.visible')
      cy.contains('button', 'Registrar assinatura manual').should('not.exist')
      cy.task<ContractEvidenceResult>('readContractEvidence', contractId, { log: false })
        .its('chargeCount')
        .should('eq', 0)
    })
  })
})
