import { ThemeProvider } from '@mui/material'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useSession } from 'next-auth/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'

import { SalesPipelineBoard } from '../../components/SalesPipelineBoard'
import { salesPipelineFixtures } from '../../fixtures/sales-pipeline-fixtures'
import { useCrmProperties, useOpportunities } from '../../hooks/use-opportunities'
import type { Opportunity, OpportunityStatus } from '../../types/opportunity'
import type { PublicPropertySummary } from '../../types/property'
import type { SalesPipelineStageId } from '../../types/sales-pipeline'
import { formatCurrency, formatMonthlyCurrency } from '../../utils/formatters'

const stageLabels: Record<SalesPipelineStageId, string> = {
  prospecting: 'Prospecção',
  qualification: 'Qualificação',
  proposal: 'Proposta',
  negotiation: 'Negociação',
  closed: 'Fechado',
}

const fixtureSummary: Record<SalesPipelineStageId, { count: number; total: number }> = {
  prospecting: { count: 3, total: 21000 },
  qualification: { count: 2, total: 19300 },
  proposal: { count: 2, total: 13100 },
  negotiation: { count: 2, total: 29500 },
  closed: { count: 2, total: 13000 },
}

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}))

vi.mock('../../hooks/use-opportunities', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../hooks/use-opportunities')>()

  return {
    ...original,
    useCrmProperties: vi.fn(),
    useOpportunities: vi.fn(),
  }
})

function makeOpportunity(
  index: number,
  status: OpportunityStatus,
  overrides: Partial<Opportunity> = {},
): Opportunity {
  return {
    id: `opportunity-${index}`,
    tenantId: 'tenant-1',
    propertyId: `property-${index}`,
    leadName: `Contato ${index}`,
    leadEmail: `contato${index}@example.com`,
    leadPhone: `(11) 90000-000${index}`,
    proposedValue: index * 1000,
    contractTermMonths: null,
    desiredStartDate: null,
    guaranteeType: 'NENHUMA',
    specialConditions: [],
    notes: null,
    status,
    archivedAt: null,
    createdAt: '2026-08-10T10:00:00.000Z',
    updatedAt: '2026-08-12T10:00:00.000Z',
    ...overrides,
  }
}

function makeProperty(
  index: number,
  overrides: Partial<PublicPropertySummary> = {},
): PublicPropertySummary {
  return {
    id: `property-${index}`,
    title: `Imóvel ${index}`,
    purpose: 'ALUGUEL',
    propertyType: 'Apartamento',
    price: index * 1000,
    condoFee: null,
    propertyTax: null,
    bedrooms: 2,
    bathrooms: 1,
    parkingSpots: 1,
    area: 70,
    city: 'São Paulo',
    neighborhood: `Bairro ${index}`,
    latitude: null,
    longitude: null,
    brokerName: null,
    coverUrl: null,
    publishedAt: '2026-08-01T10:00:00.000Z',
    ...overrides,
  }
}

function mockOpportunitiesQuery(overrides: Record<string, unknown> = {}) {
  vi.mocked(useOpportunities).mockReturnValue({
    data: [],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useOpportunities>)
}

function mockPropertiesQuery(overrides: Record<string, unknown> = {}) {
  vi.mocked(useCrmProperties).mockReturnValue({
    data: [],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useCrmProperties>)
}

function renderPipeline({ preview = false }: { preview?: boolean } = {}) {
  return render(
    <ThemeProvider theme={theme}>
      <SalesPipelineBoard preview={preview} />
    </ThemeProvider>,
  )
}

function matchesText(expected: string) {
  const normalizedExpected = expected.replace(/\s/g, ' ')

  return (_content: string, element: Element | null) => {
    const hasExpectedText = element?.textContent?.replace(/\s/g, ' ') === normalizedExpected
    const childHasExpectedText = Array.from(element?.children ?? []).some(
      (child) => child.textContent?.replace(/\s/g, ' ') === normalizedExpected,
    )

    return hasExpectedText && !childHasExpectedText
  }
}

describe('SalesPipelineBoard', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useSession).mockReturnValue({
      data: { tenantId: 'tenant-1' },
      status: 'authenticated',
      update: vi.fn(),
    } as unknown as ReturnType<typeof useSession>)
    mockOpportunitiesQuery()
    mockPropertiesQuery()
  })

  it('keeps every stage label on the same explicit typography rule', () => {
    renderPipeline()

    const typography = Object.values(stageLabels).map((label) => {
      const region = screen.getByRole('region', { name: label })
      const element = within(region).getByText(label)
      const style = window.getComputedStyle(element)

      return {
        className: element.className,
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        lineHeight: style.lineHeight,
        letterSpacing: style.letterSpacing,
        textTransform: style.textTransform,
      }
    })

    for (const stageTypography of typography.slice(1)) {
      expect(stageTypography).toEqual(typography[0])
    }
    expect(typography[0]).toMatchObject({
      fontSize: '10.5px',
      fontWeight: '700',
      lineHeight: '14px',
      textTransform: 'uppercase',
    })
    expect(typography[0]?.fontFamily).toContain('var(--font-inter)')
  })

  it('renders the structured fixtures only when the non-production preview is explicit', () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: vi.fn(),
    } as unknown as ReturnType<typeof useSession>)

    renderPipeline({ preview: true })

    expect(useOpportunities).toHaveBeenCalledWith('')
    expect(useCrmProperties).toHaveBeenCalledWith('')
    expect(salesPipelineFixtures).toHaveLength(11)
    expect(new Set(salesPipelineFixtures.map(({ opportunity }) => opportunity.id)).size).toBe(11)
    expect(
      salesPipelineFixtures.map(({ stageId, opportunity, property, presentation }) => [
        stageId,
        opportunity.leadName,
        property.title,
        opportunity.proposedValue,
        presentation.relativeDateLabel,
        presentation.indicatorLabel,
      ]),
    ).toEqual([
      ['prospecting', 'Carlos Eduardo', 'Ap 3 quartos - Moema', 5200, '2 dias', 'Status verde'],
      [
        'prospecting',
        'Letícia Ramos',
        'Casa comercial - Pinheiros',
        12000,
        '5 dias',
        'Status amarelo',
      ],
      ['prospecting', 'Rui Barbosa', 'Studio mobiliado - Itaim', 3800, '1 dia', 'Status verde'],
      ['qualification', 'Ricardo Mendes', 'Apt 3q Jardins', 4800, '5 dias', 'Status laranja'],
      ['qualification', 'Clara Antunes', 'Cobertura - Perdizes', 14500, '12 dias', 'Status verde'],
      ['proposal', 'Bruno Campina', 'Galpão industrial - Lapa', 8900, '3 dias', 'Status verde'],
      [
        'proposal',
        'Daniela Flores',
        'Ap reformado - Vila Mariana',
        4200,
        '8 dias',
        'Status laranja',
      ],
      [
        'negotiation',
        'Fernando Costa',
        'Conjunto Comercial - Paulista',
        18000,
        '15 dias',
        'Status laranja',
      ],
      [
        'negotiation',
        'Helena Vaz',
        'Casa em condomínio - Morumbi',
        11500,
        '4 dias',
        'Status verde',
      ],
      ['closed', 'Gabriel Henrique', 'Studio - Consolação', 3500, '20 dias', 'Status verde'],
      ['closed', 'Silvia Souza', 'Ap Duplex - Campo Belo', 9500, '24 dias', 'Status verde'],
    ])

    for (const fixture of salesPipelineFixtures) {
      const stage = screen.getByRole('region', { name: stageLabels[fixture.stageId] })
      const card = within(stage).getByRole('link', {
        name: `Abrir oportunidade de ${fixture.opportunity.leadName}`,
      })

      expect(card).toHaveAttribute('href', `/crm/opportunities/${fixture.opportunity.id}`)
      expect(within(card).getByText(fixture.property.title)).toBeVisible()
      expect(within(card).getByText(fixture.presentation.relativeDateLabel)).toBeVisible()
      expect(within(card).getByLabelText(fixture.presentation.indicatorLabel)).toBeVisible()
    }

    for (const stageId of Object.keys(stageLabels) as SalesPipelineStageId[]) {
      const fixtures = salesPipelineFixtures.filter((fixture) => fixture.stageId === stageId)
      const expected = fixtureSummary[stageId]
      const stage = screen.getByRole('region', { name: stageLabels[stageId] })
      const totals = within(stage).getByRole('group', {
        name: `Total projetado de ${stageLabels[stageId]}`,
      })
      const fixtureTotal = fixtures.reduce(
        (sum, fixture) => sum + fixture.opportunity.proposedValue,
        0,
      )

      expect(fixtures).toHaveLength(expected.count)
      expect(fixtureTotal).toBe(expected.total)
      expect(within(stage).getByText(String(expected.count))).toBeVisible()
      expect(
        within(totals).getByText(matchesText(formatMonthlyCurrency(expected.total))),
      ).toBeVisible()
    }
  })

  it('recalculates preview counts and totals after search and stage filtering', () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: vi.fn(),
    } as unknown as ReturnType<typeof useSession>)
    renderPipeline({ preview: true })

    const searchInput = screen.getByRole('textbox', { name: 'Buscar oportunidade' })
    fireEvent.change(searchInput, { target: { value: 'pinheiros' } })

    const prospecting = screen.getByRole('region', { name: 'Prospecção' })
    const prospectingTotals = within(prospecting).getByRole('group', {
      name: 'Total projetado de Prospecção',
    })
    expect(screen.getByText('Letícia Ramos')).toBeVisible()
    expect(screen.queryByText('Carlos Eduardo')).not.toBeInTheDocument()
    expect(within(prospecting).getByText('1')).toBeVisible()
    expect(
      within(prospectingTotals).getByText(matchesText(formatMonthlyCurrency(12000))),
    ).toBeVisible()

    fireEvent.change(searchInput, { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: /Filtrar por etapa/i }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Qualificação' }))

    const qualification = screen.getByRole('region', { name: 'Qualificação' })
    const qualificationTotals = within(qualification).getByRole('group', {
      name: 'Total projetado de Qualificação',
    })
    expect(within(qualification).getByText('Ricardo Mendes')).toBeVisible()
    expect(within(qualification).getByText('Clara Antunes')).toBeVisible()
    expect(within(qualification).getByText('2')).toBeVisible()
    expect(
      within(qualificationTotals).getByText(matchesText(formatMonthlyCurrency(19300))),
    ).toBeVisible()
    expect(screen.queryByText('Bruno Campina')).not.toBeInTheDocument()
  })

  it('preserves the real empty state for an authenticated tenant instead of using fixtures', () => {
    renderPipeline()

    expect(screen.getAllByText('Sem oportunidades nesta etapa.')).toHaveLength(5)
    for (const fixture of salesPipelineFixtures) {
      expect(screen.queryByText(fixture.opportunity.leadName)).not.toBeInTheDocument()
    }
  })

  it('keeps the public development pipeline empty when preview was not requested', () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: vi.fn(),
    } as unknown as ReturnType<typeof useSession>)

    renderPipeline()

    expect(screen.getAllByText('Sem oportunidades nesta etapa.')).toHaveLength(5)
    expect(screen.queryByText('Carlos Eduardo')).not.toBeInTheDocument()
  })

  it('keeps fixtures disabled in production even without an authenticated session', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: vi.fn(),
    } as unknown as ReturnType<typeof useSession>)

    renderPipeline({ preview: true })

    expect(screen.getAllByText('Sem oportunidades nesta etapa.')).toHaveLength(5)
    expect(screen.queryByText('Carlos Eduardo')).not.toBeInTheDocument()
  })

  it('does not flash fixtures while the session is loading', () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: 'loading',
      update: vi.fn(),
    } as unknown as ReturnType<typeof useSession>)

    const { container } = renderPipeline()

    expect(container.querySelectorAll('.MuiSkeleton-root')).toHaveLength(15)
    expect(screen.queryByText('Carlos Eduardo')).not.toBeInTheDocument()
    expect(screen.queryByText('Sem oportunidades nesta etapa.')).not.toBeInTheDocument()
  })

  it('renders the requested five-stage sales pipeline with real API statuses', () => {
    const opportunities = [
      makeOpportunity(1, 'RASCUNHO', { leadName: 'Carlos Eduardo' }),
      makeOpportunity(2, 'ENVIADA', { leadName: 'Ricardo Mendes' }),
      makeOpportunity(3, 'EM_NEGOCIACAO', { leadName: 'Daniela Flores' }),
      makeOpportunity(4, 'ACEITA', { leadName: 'Gabriel Henrique' }),
      makeOpportunity(5, 'RECUSADA', { leadName: 'Oportunidade perdida' }),
    ]
    mockOpportunitiesQuery({ data: opportunities })
    mockPropertiesQuery({ data: opportunities.map((_, index) => makeProperty(index + 1)) })

    renderPipeline()

    for (const label of ['Prospecção', 'Qualificação', 'Proposta', 'Negociação', 'Fechado']) {
      expect(screen.getByRole('region', { name: label })).toBeInTheDocument()
    }
    expect(screen.getAllByRole('region')).toHaveLength(5)
    expect(screen.getByText('Carlos Eduardo')).toBeInTheDocument()
    expect(screen.getByText('Ricardo Mendes')).toBeInTheDocument()
    expect(screen.getByText('Daniela Flores')).toBeInTheDocument()
    expect(screen.getByText('Gabriel Henrique')).toBeInTheDocument()
    const closed = screen.getByRole('region', { name: 'Fechado' })
    const closedTotals = within(closed).getByRole('group', { name: 'Total projetado de Fechado' })
    expect(within(closed).getByText('Oportunidade perdida')).toBeVisible()
    expect(within(closed).getByText('2')).toBeVisible()
    expect(within(closedTotals).getByText(matchesText(formatMonthlyCurrency(4000)))).toBeVisible()
    expect(
      within(screen.getByRole('region', { name: 'Qualificação' })).getByText('0'),
    ).toBeVisible()
  })

  it('shows compact cards and projected totals for rent and sale', () => {
    mockOpportunitiesQuery({
      data: [
        makeOpportunity(1, 'RASCUNHO', {
          leadName: 'Carlos Eduardo',
          proposedValue: 5200,
        }),
        makeOpportunity(2, 'RASCUNHO', {
          leadName: 'Letícia Ramos',
          proposedValue: 920000,
        }),
      ],
    })
    mockPropertiesQuery({
      data: [
        makeProperty(1, { title: 'Studio Vila Mariana', purpose: 'ALUGUEL' }),
        makeProperty(2, { title: 'Casa Pinheiros', purpose: 'VENDA' }),
      ],
    })

    renderPipeline()

    const prospecting = screen.getByRole('region', { name: 'Prospecção' })
    const totals = within(prospecting).getByRole('group', {
      name: 'Total projetado de Prospecção',
    })
    const rentalCard = within(prospecting).getByRole('link', {
      name: 'Abrir oportunidade de Carlos Eduardo',
    })
    const saleCard = within(prospecting).getByRole('link', {
      name: 'Abrir oportunidade de Letícia Ramos',
    })
    expect(within(prospecting).getByText('Studio Vila Mariana')).toBeVisible()
    expect(within(prospecting).getByText('Casa Pinheiros')).toBeVisible()
    expect(within(rentalCard).getByText(matchesText(formatMonthlyCurrency(5200)))).toBeVisible()
    expect(within(saleCard).getByText(matchesText(formatCurrency(920000)))).toBeVisible()
    expect(within(totals).getByText('Aluguel')).toBeVisible()
    expect(within(totals).getByText('Venda')).toBeVisible()
    expect(within(totals).getByText(matchesText(formatMonthlyCurrency(5200)))).toBeVisible()
    expect(within(totals).getByText(matchesText(formatCurrency(920000)))).toBeVisible()
  })

  it('searches by contact and property context', async () => {
    const user = userEvent.setup()
    mockOpportunitiesQuery({
      data: [
        makeOpportunity(1, 'RASCUNHO', { leadName: 'Carlos Eduardo' }),
        makeOpportunity(2, 'ENVIADA', { leadName: 'Ricardo Mendes' }),
      ],
    })
    mockPropertiesQuery({
      data: [
        makeProperty(1, { title: 'Studio Centro' }),
        makeProperty(2, { title: 'Casa Familiar', neighborhood: 'Pinheiros' }),
      ],
    })
    renderPipeline()

    await user.type(screen.getByRole('textbox', { name: 'Buscar oportunidade' }), 'pinheiros')

    expect(screen.getByText('Ricardo Mendes')).toBeVisible()
    expect(screen.queryByText('Carlos Eduardo')).not.toBeInTheDocument()
  })

  it('filters by stage and restores all stages', async () => {
    const user = userEvent.setup()
    mockOpportunitiesQuery({
      data: [
        makeOpportunity(1, 'RASCUNHO', { leadName: 'Carlos Eduardo' }),
        makeOpportunity(2, 'EM_NEGOCIACAO', { leadName: 'Daniela Flores' }),
      ],
    })
    renderPipeline()

    await user.click(screen.getByRole('button', { name: /Filtrar por etapa/i }))
    await user.click(screen.getByRole('menuitem', { name: 'Negociação' }))

    expect(screen.getByText('Daniela Flores')).toBeVisible()
    expect(screen.queryByText('Carlos Eduardo')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Negociação' }))
    await user.click(screen.getByRole('menuitem', { name: 'Todas as etapas' }))

    expect(screen.getByText('Daniela Flores')).toBeVisible()
    expect(screen.getByText('Carlos Eduardo')).toBeVisible()
  })

  it('keeps all columns stable while loading and creation explicitly unavailable', () => {
    mockOpportunitiesQuery({ isLoading: true })

    const { container } = renderPipeline()

    expect(screen.getAllByRole('region')).toHaveLength(5)
    expect(container.querySelectorAll('.MuiSkeleton-root')).toHaveLength(15)
    expect(screen.getByRole('button', { name: 'Nova Oportunidade' })).toBeDisabled()
  })

  it('shows the API error and retries the opportunities query', () => {
    const refetch = vi.fn()
    mockOpportunitiesQuery({ isError: true, refetch })
    renderPipeline()

    fireEvent.click(
      within(screen.getByRole('alert')).getByRole('button', { name: 'Tentar novamente' }),
    )

    expect(refetch).toHaveBeenCalledOnce()
  })

  it('does not render misleading cards or totals when properties fail', () => {
    const refetch = vi.fn()
    mockOpportunitiesQuery({ data: [makeOpportunity(1, 'RASCUNHO')] })
    mockPropertiesQuery({ isError: true, refetch })
    renderPipeline()

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Não foi possível carregar os dados do pipeline.',
    )
    expect(screen.queryByLabelText('Pipeline de oportunidades')).not.toBeInTheDocument()

    fireEvent.click(
      within(screen.getByRole('alert')).getByRole('button', { name: 'Tentar novamente' }),
    )
    expect(refetch).toHaveBeenCalledOnce()
  })
})
