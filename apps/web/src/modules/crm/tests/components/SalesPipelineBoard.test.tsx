import { ThemeProvider } from '@mui/material'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useSession } from 'next-auth/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'

import { SalesPipelineBoard } from '../../components/SalesPipelineBoard'
import {
  useCreateOpportunity,
  useCrmProperties,
  useOpportunities,
} from '../../hooks/use-opportunities'
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

const pipelineViewModeStorageKey = 'ketris.crm.pipeline.viewMode'

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}))

vi.mock('@shared/hooks/use-dashboard-agenda-notifications', () => ({
  useDashboardAgendaNotifications: () => [],
}))

vi.mock('../../hooks/use-opportunities', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../hooks/use-opportunities')>()

  return {
    ...original,
    useCrmProperties: vi.fn(),
    useOpportunities: vi.fn(),
    useCreateOpportunity: vi.fn(),
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
    brokerAvatarUrl: null,
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

function mockCreateOpportunity(overrides: Record<string, unknown> = {}) {
  vi.mocked(useCreateOpportunity).mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
    ...overrides,
  } as unknown as ReturnType<typeof useCreateOpportunity>)
}

function renderPipeline() {
  return render(
    <ThemeProvider theme={theme}>
      <SalesPipelineBoard />
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
    window.localStorage.removeItem(pipelineViewModeStorageKey)
    vi.mocked(useSession).mockReturnValue({
      data: { tenantId: 'tenant-1' },
      status: 'authenticated',
      update: vi.fn(),
    } as unknown as ReturnType<typeof useSession>)
    mockOpportunitiesQuery()
    mockPropertiesQuery()
    mockCreateOpportunity()
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
      fontSize: '14.5px',
      fontWeight: '700',
      lineHeight: '18px',
      textTransform: 'uppercase',
    })
    expect(typography[0]?.fontFamily).toContain('var(--font-inter)')
  })

  it('restores and saves the selected pipeline view mode preference', async () => {
    const user = userEvent.setup()
    window.localStorage.setItem(pipelineViewModeStorageKey, 'list')

    renderPipeline()

    expect(screen.getByRole('button', { name: 'Ver em lista' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    await user.click(screen.getByRole('button', { name: 'Ver em quadro' }))

    expect(window.localStorage.getItem(pipelineViewModeStorageKey)).toBe('kanban')
    expect(screen.getByRole('region', { name: 'Prospecção' })).toBeVisible()
  })

  it('keeps the API-backed pipeline empty when there are no opportunities', () => {
    renderPipeline()

    expect(screen.getAllByText('Sem oportunidades nesta etapa.')).toHaveLength(5)
    expect(screen.queryByText('Carlos Eduardo')).not.toBeInTheDocument()
  })

  it('does not render opportunity cards while the session is loading', () => {
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

    for (const label of Object.values(stageLabels)) {
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

  it('keeps all columns stable while loading and creation available', () => {
    mockOpportunitiesQuery({ isLoading: true })

    const { container } = renderPipeline()

    expect(screen.getAllByRole('region')).toHaveLength(5)
    expect(container.querySelectorAll('.MuiSkeleton-root')).toHaveLength(15)
    expect(screen.getByRole('button', { name: 'Nova Oportunidade' })).toBeEnabled()
  })

  it('opens the create opportunity dialog from the toolbar button', async () => {
    const user = userEvent.setup()
    mockOpportunitiesQuery({ data: [makeOpportunity(1, 'RASCUNHO')] })
    mockPropertiesQuery({ data: [makeProperty(1)] })
    renderPipeline()

    await user.click(screen.getByRole('button', { name: 'Nova Oportunidade' }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
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
