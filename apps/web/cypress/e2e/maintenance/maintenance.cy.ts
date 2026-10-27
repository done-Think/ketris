import type {
  MaintenanceEvidence,
  MaintenanceFixtureResult,
} from '../../types/maintenance-fixtures'
const password = 'maintenance-local-e2e-password-123'
let fixture: MaintenanceFixtureResult | null = null
beforeEach(() => cy.viewport(1440, 1000))
afterEach(() => {
  if (fixture) cy.task('cleanupMaintenanceFixtures', fixture.tenantIds)
  fixture = null
})
function setup(renter = false) {
  cy.task<MaintenanceFixtureResult>('seedMaintenanceFixtures', {
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
function detail() {
  cy.then(() => cy.visit('/pt/dashboard/maintenance/' + fixture!.ticketId))
}
function confirm() {
  cy.get('[role="dialog"]')
    .contains('button', /^Confirmar$/)
    .click()
}

describe('Maintenance real workflows', () => {
  it('gerencia o catálogo sem alterar os dados já atribuídos ao chamado', () => {
    setup()
    cy.visit('/pt/dashboard/maintenance')
    cy.contains('button', 'Prestadores da imobiliária').click()
    cy.contains('button', 'Cadastrar prestador').click()
    cy.get('[role="dialog"]').last().find('input[name="name"]').type('Prestador original E2E')
    cy.intercept('POST', '**/api/maintenance/providers').as('providerCreate')
    cy.get('[role="dialog"]')
      .last()
      .contains('button', /^Salvar$/)
      .click()
    cy.wait('@providerCreate').its('response.statusCode').should('eq', 201)
    cy.contains('button', /^Fechar$/).click()
    detail()
    cy.contains('button', 'Definir prestador').click()
    cy.get('[role="dialog"] input[role="combobox"]').type('Prestador original')
    cy.contains('[role="option"]', 'Prestador original E2E').click()
    cy.intercept('POST', '**/actions').as('providerAssign')
    confirm()
    cy.wait('@providerAssign').its('response.statusCode').should('eq', 200)
    cy.visit('/pt/dashboard/maintenance')
    cy.contains('button', 'Prestadores da imobiliária').click()
    cy.contains('button', /^Editar$/).click()
    cy.get('[role="dialog"]')
      .last()
      .find('input[name="name"]')
      .clear()
      .type('Prestador atualizado E2E')
    cy.intercept('PATCH', '**/api/maintenance/providers/*').as('providerUpdate')
    cy.get('[role="dialog"]')
      .last()
      .contains('button', /^Salvar$/)
      .click()
    cy.wait('@providerUpdate').its('response.statusCode').should('eq', 200)
    cy.contains('button', 'Inativar').click()
    cy.wait('@providerUpdate').its('response.body.provider.active').should('eq', false)
    cy.contains('label', 'Incluir inativos').click()
    cy.contains('Prestador atualizado E2E').should('be.visible')
    cy.then(() => cy.task<MaintenanceEvidence>('readMaintenanceEvidence', fixture!.ticketId)).then(
      (result) => {
        expect(result.providerName).to.eq('Prestador original E2E')
        expect(result.providerId).to.be.a('string')
      },
    )
    cy.contains('button', 'Reativar').click()
    cy.wait('@providerUpdate').its('response.body.provider.active').should('eq', true)
  })

  it('pagina no servidor, mantém contagens globais e cadastra pelo contrato sem propertyId redundante', () => {
    setup()
    cy.intercept('GET', '**/api/maintenance/tickets?*').as('tickets')
    cy.visit('/pt/dashboard/maintenance')
    cy.wait('@tickets').then(({ response }) => {
      expect(response?.body.items).to.have.length(5)
      expect(response?.body.summary.totalCount).to.eq(6)
      expect(response?.body.summary.urgentCount).to.eq(1)
    })
    cy.get('button[aria-label="Go to next page"]').filter(':visible').click()
    cy.wait('@tickets').then(({ request, response }) => {
      expect(request.url).to.include('page=2')
      expect(response?.body.items).to.have.length(1)
      expect(response?.body.summary.totalCount).to.eq(6)
    })
    cy.contains('label', 'Filtrar por categoria')
      .filter(':visible')
      .parent()
      .find('[role="combobox"]')
      .click()
    cy.contains('[role="option"]', 'Elétrica').click()
    cy.wait('@tickets').then(({ request, response }) => {
      expect(request.url).to.include('category=ELECTRICAL')
      expect(request.url).to.include('page=1')
      expect(response?.body.items).to.have.length(0)
      expect(response?.body.summary.totalCount).to.eq(6)
    })
    cy.contains('label', 'Filtrar por categoria')
      .filter(':visible')
      .parent()
      .find('[role="combobox"]')
      .click()
    cy.contains('[role="option"]', 'Todas as categorias').click()
    cy.get('tbody tr').should('have.length', 5)
    cy.contains('button', /Novo Chamado|Novo chamado/).click()
    cy.get('[role="dialog"] input[name="title"]').type('Novo chamado real')
    cy.get('[role="dialog"] textarea[name="description"]').type('Relato real do problema')
    cy.get('[role="dialog"] [role="combobox"]').eq(0).click()
    cy.contains('[role="option"]', 'MNT-E2E-001').click()
    cy.get('[role="dialog"] [role="combobox"]').eq(1).click()
    cy.contains('[role="option"]', 'Hidráulica').click()
    cy.intercept('POST', '**/api/maintenance/tickets').as('create')
    cy.contains('button', 'Criar Chamado').click()
    cy.wait('@create').then(({ request, response }) => {
      expect(response?.statusCode).to.eq(201)
      expect(request.body.category).to.eq('PLUMBING')
      expect(request.body).not.to.have.property('propertyId')
    })
  })
  it('permite ao locatário compartilhado cadastrar prestador, enviar 8 MB privados, agendar e finalizar', () => {
    setup(true)
    detail()
    cy.contains('button', 'Definir prestador').click()
    cy.get('[role="dialog"] input[name="name"]').type('Prestador, manutenção E2E')
    cy.get('[role="dialog"] input[name="phone"]').type('11999999999')
    confirm()
    cy.contains('Prestador: Prestador, manutenção E2E').should('be.visible')
    cy.intercept('POST', '**/attachments/complete').as('completeUpload')
    cy.window().then((win) => {
      const bytes = new win.Uint8Array(8 * 1024 * 1024)
      const png = win.atob(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l1sAAAAASUVORK5CYII=',
      )
      for (let index = 0; index < png.length; index++) bytes[index] = png.charCodeAt(index)
      const transfer = new win.DataTransfer()
      transfer.items.add(new win.File([bytes], 'repair-8mb.png', { type: 'image/png' }))
      const input = win.document.querySelector<HTMLInputElement>('input[type="file"]')!
      input.files = transfer.files
      input.dispatchEvent(new win.Event('change', { bubbles: true }))
    })
    cy.wait('@completeUpload', { timeout: 45000 }).then(({ response }) => {
      expect(response?.statusCode).to.eq(201)
      cy.request({ url: response!.body.attachment.url, followRedirect: false }).then((result) => {
        expect(result.status).to.eq(302)
        expect(result.headers['cache-control']).to.eq('private, no-store')
        cy.window().then(async (win) => {
          const image = await win.fetch(String(result.headers.location))
          expect(image.status).to.eq(200)
          expect((await image.arrayBuffer()).byteLength).to.eq(8 * 1024 * 1024)
        })
      })
    })
    cy.get('textarea[name="message"]').type('Prestador confirmou a visita, sem dados fictícios.')
    cy.contains('button', 'Enviar Mensagem').click()
    cy.contains('Prestador confirmou a visita, sem dados fictícios.').should('be.visible')
    cy.get('input[name="scheduledDate"]').type('2026-11-15')
    cy.get('select[name="scheduledHour"]').select('14')
    cy.get('select[name="scheduledMinute"]').select('30')
    cy.intercept('POST', '**/actions').as('action')
    cy.contains('button', 'Salvar data').click()
    cy.wait('@action').its('response.statusCode').should('eq', 200)
    cy.contains('button', 'Finalizar chamado').click()
    confirm()
    cy.wait('@action').its('response.body.ticket.status').should('eq', 'RESOLVIDO')
    cy.then(() => cy.task<MaintenanceEvidence>('readMaintenanceEvidence', fixture!.ticketId)).then(
      (result) => {
        expect(result.attachmentCount).to.eq(1)
        expect(result.uploadId).to.be.a('string')
        expect(result.providerId).to.be.a('string')
        expect(result.status).to.eq('RESOLVIDO')
      },
    )
  })
})
