import { ThemeProvider } from '@mui/material'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useSession } from 'next-auth/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'

import { PipelineBoard } from '../../components/PipelineBoard'
import { opportunityStages } from '../../config/opportunity-stages'
import { useCrmProperties, useOpportunities } from '../../hooks/use-opportunities'
import type { Opportunity, OpportunityStatus } from '../../types/opportunity'
import type { PublicPropertySummary } from '../../types/property'
import { formatCurrency, formatMonthlyCurrency } from '../../utils/formatters'

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
    imovelId: `property-${index}`,
    interessadoNome: `Contato ${index}`,
    interessadoEmail: `contact${index}@example.com`,
    interessadoTelefone: `(11) 90000-000${index}`,
    valorProposto: index * 1000,
    prazoContratoMeses: null,
    inicioPretendido: null,
    garantiaContratual: 'NENHUMA',
    condicoesEspeciais: [],
    observacoes: null,
    status,
    arquivadaEm: null,
    createdAt: '2026-08-10T10:00:00.000Z',
    updatedAt: '2026-08-12T10:00:00.000Z',
    ...overrides,
  }
}

function makeProperty(index: number, overrides: Partial<PublicPropertySummary> = {}) {
  return {
    id: `property-${index}`,
    titulo: `Imovel ${index}`,
    finalidade: 'ALUGUEL' as const,
    tipo: 'Apartamento',
    valor: index * 1000,
    condominio: null,
    iptu: null,
    quartos: 2,
    banheiros: 1,
    vagas: 1,
    areaM2: 70,
    cidade: 'Sao Paulo',
    bairro: `Bairro ${index}`,
    capaUrl: null,
    publicadoEm: '2026-08-01T10:00:00.000Z',
    ...overrides,
  } satisfies PublicPropertySummary
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

function renderPipeline(initialStatus?: OpportunityStatus) {
  return render(
    <ThemeProvider theme={theme}>
      <PipelineBoard initialStatus={initialStatus} />
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

describe('PipelineBoard', () => {
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

  it('renders the five API stages with their counts, totals, and detail links', () => {
    const opportunities = opportunityStages.map((stage, index) =>
      makeOpportunity(index + 1, stage.status),
    )
    mockOpportunitiesQuery({ data: opportunities })
    mockPropertiesQuery({
      data: opportunities.map((_, index) => makeProperty(index + 1)),
    })

    renderPipeline()

    for (const [index, stage] of opportunityStages.entries()) {
      const section = screen.getByRole('region', { name: stage.label })
      const totals = within(section).getByRole('group', {
        name: `Total projetado de ${stage.label}`,
      })
      expect(within(section).getByText('1')).toBeInTheDocument()
      expect(
        within(totals).getByText(matchesText(formatMonthlyCurrency((index + 1) * 1000))),
      ).toBeInTheDocument()
      expect(
        within(section).getByRole('link', { name: `Abrir oportunidade de Contato ${index + 1}` }),
      ).toHaveAttribute('href', `/crm/opportunities/opportunity-${index + 1}`)
    }
  })

  it('separates rental and sale totals instead of aggregating incompatible values', () => {
    mockOpportunitiesQuery({
      data: [
        makeOpportunity(1, 'RASCUNHO', { valorProposto: 3000 }),
        makeOpportunity(2, 'RASCUNHO', { valorProposto: 500000 }),
      ],
    })
    mockPropertiesQuery({
      data: [makeProperty(1, { finalidade: 'ALUGUEL' }), makeProperty(2, { finalidade: 'VENDA' })],
    })

    renderPipeline()

    const stage = screen.getByRole('region', { name: 'Prospecção' })
    const totals = within(stage).getByRole('group', { name: 'Total projetado de Prospecção' })
    expect(within(totals).getByText('Aluguel')).toBeInTheDocument()
    expect(within(totals).getByText('Venda')).toBeInTheDocument()
    expect(within(totals).getByText(matchesText(formatMonthlyCurrency(3000)))).toBeInTheDocument()
    expect(within(totals).getByText(matchesText(formatCurrency(500000)))).toBeInTheDocument()
  })

  it('preserves all five columns while loading and renders their skeletons', () => {
    mockOpportunitiesQuery({ isLoading: true })

    const { container } = renderPipeline()

    expect(screen.getAllByRole('region')).toHaveLength(5)
    expect(screen.getAllByText('-')).toHaveLength(5)
    expect(container.querySelectorAll('.MuiSkeleton-root')).toHaveLength(15)
  })

  it('renders an empty state in every stage', () => {
    renderPipeline()

    expect(screen.getAllByText('Sem oportunidades nesta etapa.')).toHaveLength(5)
    expect(screen.getAllByText(matchesText(formatCurrency(0)))).toHaveLength(5)
  })

  it('shows the request error and retries the opportunities query', () => {
    const refetch = vi.fn()
    mockOpportunitiesQuery({ isError: true, refetch })

    renderPipeline()
    fireEvent.click(
      within(screen.getByRole('alert')).getByRole('button', { name: 'Tentar novamente' }),
    )

    expect(refetch).toHaveBeenCalledOnce()
  })

  it('filters cards by contact and property data', async () => {
    const user = userEvent.setup()
    mockOpportunitiesQuery({
      data: [
        makeOpportunity(1, 'RASCUNHO', { interessadoNome: 'Carlos Eduardo' }),
        makeOpportunity(2, 'ENVIADA', { interessadoNome: 'Leticia Ramos' }),
      ],
    })
    mockPropertiesQuery({
      data: [
        makeProperty(1, { titulo: 'Apartamento Jardins' }),
        makeProperty(2, { titulo: 'Casa Pinheiros' }),
      ],
    })
    renderPipeline()

    await user.type(screen.getByRole('textbox', { name: 'Buscar oportunidade' }), 'jardins')

    expect(screen.getByText('Carlos Eduardo')).toBeInTheDocument()
    expect(screen.queryByText('Leticia Ramos')).not.toBeInTheDocument()
  })

  it('filters the board by the selected stage', async () => {
    const user = userEvent.setup()
    mockOpportunitiesQuery({
      data: [makeOpportunity(1, 'RASCUNHO'), makeOpportunity(2, 'EM_NEGOCIACAO')],
    })
    renderPipeline()
    const negotiationStage = opportunityStages.find((stage) => stage.status === 'EM_NEGOCIACAO')!

    await user.click(screen.getByRole('button', { name: /Filtrar por etapa/i }))
    await user.click(screen.getByRole('menuitem', { name: negotiationStage.label }))

    expect(screen.getByText('Contato 2')).toBeInTheDocument()
    expect(screen.queryByText('Contato 1')).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: new RegExp(negotiationStage.label, 'i') }),
    ).toBeVisible()
  })

  it('starts filtered when the route provides a real API status', () => {
    mockOpportunitiesQuery({
      data: [makeOpportunity(1, 'RASCUNHO'), makeOpportunity(2, 'ENVIADA')],
    })

    renderPipeline('ENVIADA')

    expect(screen.getByText('Contato 2')).toBeInTheDocument()
    expect(screen.queryByText('Contato 1')).not.toBeInTheDocument()
  })

  it('keeps creation unavailable until a tenant-scoped endpoint exists', () => {
    renderPipeline()

    expect(screen.getByRole('button', { name: 'Nova Oportunidade' })).toBeDisabled()
  })
})
