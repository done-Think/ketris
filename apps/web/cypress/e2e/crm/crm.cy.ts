const session = {
  user: {
    id: 'user-1',
    name: 'Marcelo Silva',
    email: 'marcelo@premium.com.br',
    image: null,
  },
  expires: '2099-12-31T23:59:59.999Z',
  accessToken: 'crm-e2e-token',
  refreshToken: 'crm-e2e-refresh-token',
  scope: 'tenant',
  tenantId: 'tenant-1',
  papel: 'AGENT',
}

const properties = [
  {
    id: 'property-1',
    titulo: 'Apartamento Jardins Premium',
    finalidade: 'ALUGUEL',
    tipo: 'Apartamento',
    valor: 4500,
    condominio: 850,
    iptu: 280,
    quartos: 2,
    banheiros: 2,
    vagas: 1,
    areaM2: 84,
    cidade: 'São Paulo',
    bairro: 'Jardins',
    capaUrl: null,
    publicadoEm: '2026-08-01T10:00:00.000Z',
  },
  {
    id: 'property-2',
    titulo: 'Studio Vila Mariana',
    finalidade: 'ALUGUEL',
    tipo: 'Studio',
    valor: 3900,
    condominio: 520,
    iptu: null,
    quartos: 1,
    banheiros: 1,
    vagas: 0,
    areaM2: 48,
    cidade: 'São Paulo',
    bairro: 'Vila Mariana',
    capaUrl: null,
    publicadoEm: '2026-08-02T10:00:00.000Z',
  },
  {
    id: 'property-3',
    titulo: 'Casa Pinheiros',
    finalidade: 'VENDA',
    tipo: 'Casa',
    valor: 980000,
    condominio: null,
    iptu: 430,
    quartos: 3,
    banheiros: 3,
    vagas: 2,
    areaM2: 164,
    cidade: 'São Paulo',
    bairro: 'Pinheiros',
    capaUrl: null,
    publicadoEm: '2026-08-03T10:00:00.000Z',
  },
]

const opportunitySeed = [
  ['Ricardo Mendes', 'ricardo.mendes@email.com', 'property-1', 'ENVIADA', 4800],
  ['Carlos Eduardo', 'carlos.edu@teclube.com', 'property-2', 'RASCUNHO', 5200],
  ['Letícia Ramos', 'leticia.ramos@outlook.com', 'property-3', 'RASCUNHO', 920000],
  ['Daniela Flores', 'daniela.flores@email.com', 'property-1', 'EM_NEGOCIACAO', 4200],
  ['Fernando Costa', 'fernando.costa@email.com', 'property-3', 'EM_NEGOCIACAO', 950000],
  ['Gabriel Henrique', 'gabriel@email.com', 'property-2', 'ACEITA', 3500],
  ['Silvia Souza', 'silvia@email.com', 'property-1', 'RECUSADA', 4100],
] as const

const opportunities = opportunitySeed.map(([name, email, propertyId, status, value], index) => ({
  id: `opportunity-${index + 1}`,
  tenantId: 'tenant-1',
  imovelId: propertyId,
  interessadoNome: name,
  interessadoEmail: email,
  interessadoTelefone: `(11) 9872${index}-120${index}`,
  valorProposto: value,
  prazoContratoMeses: index === 0 ? 30 : null,
  inicioPretendido: index === 0 ? '2026-09-01T00:00:00.000Z' : null,
  garantiaContratual: index === 0 ? 'FIADOR' : 'NENHUMA',
  condicoesEspeciais: index === 0 ? ['Aceita pets'] : [],
  observacoes: index === 0 ? 'Prefere visitas pela manhã.' : null,
  status,
  arquivadaEm: null,
  createdAt: `2026-08-${String(index + 1).padStart(2, '0')}T10:00:00.000Z`,
  updatedAt: `2026-08-${String(index + 5).padStart(2, '0')}T12:00:00.000Z`,
}))

function interceptCrm() {
  cy.intercept('GET', '**/api/auth/session', session).as('session')
  cy.intercept('GET', '**/api/marketplace/inquiries*', { inquiries: opportunities }).as(
    'opportunities',
  )
  cy.intercept('GET', '**/api/marketplace/properties', { properties }).as('properties')
  cy.intercept('GET', '**/api/marketplace/inquiries/opportunity-1', {
    inquiry: opportunities[0],
  }).as('opportunity')
  cy.intercept('GET', '**/api/marketplace/properties/property-1', {
    property: {
      ...properties[0],
      descricao: 'Apartamento reformado em localização central.',
      endereco: {
        logradouro: 'Alameda Santos',
        numero: '1000',
        complemento: null,
        bairro: 'Jardins',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '01418-100',
        latitude: null,
        longitude: null,
      },
      midias: [],
    },
  }).as('property')
}

function waitForUi() {
  cy.document().then((document) => document.fonts.ready)
  cy.get('[role="progressbar"]').should('not.exist')
}

describe('CRM', () => {
  beforeEach(() => {
    interceptCrm()
  })

  it('renders the desktop pipeline close to the reference', () => {
    cy.viewport(1440, 900)
    cy.visit('/crm')
    cy.wait(['@session', '@opportunities', '@properties'])
    waitForUi()

    cy.get('h1').contains('Pipeline de Vendas').should('be.visible')
    cy.get('[role="region"]').should('have.length', 5)
    cy.contains('Ricardo Mendes').should('be.visible')
    cy.document().its('documentElement.scrollWidth').should('eq', 1440)
    cy.screenshot('crm-pipeline-desktop', { capture: 'viewport' })
  })

  it('renders contacts and the opportunity detail', () => {
    cy.viewport(1440, 900)
    cy.visit('/crm/contatos')
    cy.wait(['@session', '@opportunities'])
    waitForUi()

    cy.get('h1').contains('Contatos').should('be.visible')
    cy.get('table[aria-label="Contatos do CRM"]').should('be.visible')
    cy.screenshot('crm-contacts-desktop', { capture: 'viewport' })

    cy.visit('/crm/oportunidades/opportunity-1')
    cy.wait(['@session', '@opportunity', '@property'])
    waitForUi()

    cy.get('h1').contains('Ricardo Mendes').should('be.visible')
    cy.contains('Apartamento Jardins Premium').should('be.visible')
    cy.screenshot('crm-opportunity-desktop', { capture: 'viewport' })
  })

  it('keeps the mobile pipeline contained and navigable', () => {
    cy.viewport(390, 844)
    cy.visit('/crm')
    cy.wait(['@session', '@opportunities', '@properties'])
    waitForUi()

    cy.get('h1').contains('Pipeline de Vendas').should('be.visible')
    cy.get('button[aria-label="Abrir navegação"]').should('be.visible')
    cy.document().its('documentElement.scrollWidth').should('eq', 390)
    cy.screenshot('crm-pipeline-mobile', { capture: 'viewport' })
  })

  it('adapts contacts and opportunity detail to mobile', () => {
    cy.viewport(390, 844)
    cy.visit('/crm/contatos')
    cy.wait(['@session', '@opportunities'])
    waitForUi()

    cy.get('h1').contains('Contatos').should('be.visible')
    cy.get('table[aria-label="Contatos do CRM"]').should('not.be.visible')
    cy.contains('Ricardo Mendes').should('be.visible')
    cy.document().its('documentElement.scrollWidth').should('eq', 390)
    cy.screenshot('crm-contacts-mobile', { capture: 'viewport' })

    cy.visit('/crm/oportunidades/opportunity-1')
    cy.wait(['@session', '@opportunity', '@property'])
    waitForUi()

    cy.get('h1').contains('Ricardo Mendes').should('be.visible')
    cy.contains('Informações de contato e interesse').should('be.visible')
    cy.document().its('documentElement.scrollWidth').should('eq', 390)
    cy.screenshot('crm-opportunity-mobile', { capture: 'viewport' })
  })
})
