import { ThemeProvider } from '@mui/material'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useSession } from 'next-auth/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'

import { useCrmProperties, useOpportunities } from '../hooks/use-opportunities'
import type { Opportunity, OpportunityStatus } from '../types/opportunity'
import type { PublicPropertySummary } from '../types/property'
import { formatCurrency, formatMonthlyCurrency } from '../utils/formatters'
import { SalesPipelineBoard } from './SalesPipelineBoard'

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}))

vi.mock('../hooks/use-opportunities', async (importOriginal) => {
  const original = await importOriginal<typeof import('../hooks/use-opportunities')>()

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
    interessadoEmail: `contato${index}@example.com`,
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

function makeProperty(
  index: number,
  overrides: Partial<PublicPropertySummary> = {},
): PublicPropertySummary {
  return {
    id: `property-${index}`,
    titulo: `Imóvel ${index}`,
    finalidade: 'ALUGUEL',
    tipo: 'Apartamento',
    valor: index * 1000,
    condominio: null,
    iptu: null,
    quartos: 2,
    banheiros: 1,
    vagas: 1,
    areaM2: 70,
    cidade: 'São Paulo',
    bairro: `Bairro ${index}`,
    capaUrl: null,
    publicadoEm: '2026-08-01T10:00:00.000Z',
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

  it('renders the requested five-stage sales pipeline with real API statuses', () => {
    const opportunities = [
      makeOpportunity(1, 'RASCUNHO', { interessadoNome: 'Carlos Eduardo' }),
      makeOpportunity(2, 'ENVIADA', { interessadoNome: 'Ricardo Mendes' }),
      makeOpportunity(3, 'EM_NEGOCIACAO', { interessadoNome: 'Daniela Flores' }),
      makeOpportunity(4, 'ACEITA', { interessadoNome: 'Gabriel Henrique' }),
      makeOpportunity(5, 'RECUSADA', { interessadoNome: 'Oportunidade perdida' }),
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
          interessadoNome: 'Carlos Eduardo',
          valorProposto: 5200,
        }),
        makeOpportunity(2, 'RASCUNHO', {
          interessadoNome: 'Letícia Ramos',
          valorProposto: 920000,
        }),
      ],
    })
    mockPropertiesQuery({
      data: [
        makeProperty(1, { titulo: 'Studio Vila Mariana', finalidade: 'ALUGUEL' }),
        makeProperty(2, { titulo: 'Casa Pinheiros', finalidade: 'VENDA' }),
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
        makeOpportunity(1, 'RASCUNHO', { interessadoNome: 'Carlos Eduardo' }),
        makeOpportunity(2, 'ENVIADA', { interessadoNome: 'Ricardo Mendes' }),
      ],
    })
    mockPropertiesQuery({
      data: [
        makeProperty(1, { titulo: 'Studio Centro' }),
        makeProperty(2, { titulo: 'Casa Familiar', bairro: 'Pinheiros' }),
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
        makeOpportunity(1, 'RASCUNHO', { interessadoNome: 'Carlos Eduardo' }),
        makeOpportunity(2, 'EM_NEGOCIACAO', { interessadoNome: 'Daniela Flores' }),
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
