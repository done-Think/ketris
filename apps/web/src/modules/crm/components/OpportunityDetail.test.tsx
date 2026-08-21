import { ThemeProvider } from '@mui/material'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'

import { ricardoMendesOpportunityId } from '../fixtures/opportunity-detail-fixtures'
import type { Opportunity } from '../types/opportunity'
import type { PublicPropertyDetail } from '../types/property'
import { OpportunityDetail } from './OpportunityDetail'

const mocks = vi.hoisted(() => ({
  useOpportunity: vi.fn(),
  useCrmProperty: vi.fn(),
  useUpdateOpportunity: vi.fn(),
  update: vi.fn(),
  refetchOpportunity: vi.fn(),
  refetchProperty: vi.fn(),
  enqueueSnackbar: vi.fn(),
}))

vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: { tenantId: 'tenant-1', scope: 'tenant', user: { id: 'user-1' } },
    status: 'authenticated',
  }),
}))

vi.mock('notistack', () => ({
  useSnackbar: () => ({ enqueueSnackbar: mocks.enqueueSnackbar }),
}))

vi.mock('../hooks/use-opportunities', () => ({
  useOpportunity: mocks.useOpportunity,
  useCrmProperty: mocks.useCrmProperty,
  useUpdateOpportunity: mocks.useUpdateOpportunity,
}))

const opportunity: Opportunity = {
  id: 'opportunity-1',
  tenantId: 'tenant-1',
  imovelId: 'property-1',
  interessadoNome: 'Ricardo Mendes',
  interessadoEmail: 'ricardo@example.com',
  interessadoTelefone: '(11) 98722-1200',
  valorProposto: 4800,
  prazoContratoMeses: 30,
  inicioPretendido: '2026-09-01T00:00:00.000Z',
  garantiaContratual: 'FIADOR',
  condicoesEspeciais: ['Aceita pets'],
  observacoes: 'Prefere visitas pela manhã.',
  status: 'ENVIADA',
  arquivadaEm: null,
  createdAt: '2026-08-10T10:00:00.000Z',
  updatedAt: '2026-08-12T10:00:00.000Z',
}

const property: PublicPropertyDetail = {
  id: 'property-1',
  titulo: 'Apartamento Jardins',
  finalidade: 'ALUGUEL',
  tipo: 'Apartamento',
  valor: 4500,
  condominio: 800,
  iptu: null,
  quartos: 2,
  banheiros: 2,
  vagas: 1,
  areaM2: 84,
  cidade: 'São Paulo',
  bairro: 'Jardins',
  capaUrl: null,
  publicadoEm: '2026-08-01T10:00:00.000Z',
  descricao: null,
  endereco: null,
  midias: [],
}

function renderDetail(opportunityId = opportunity.id) {
  return render(
    <ThemeProvider theme={theme}>
      <OpportunityDetail opportunityId={opportunityId} />
    </ThemeProvider>,
  )
}

describe('OpportunityDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.useOpportunity.mockReturnValue({
      data: opportunity,
      isLoading: false,
      isError: false,
      refetch: mocks.refetchOpportunity,
    })
    mocks.useCrmProperty.mockReturnValue({
      data: property,
      isLoading: false,
      isError: false,
      refetch: mocks.refetchProperty,
    })
    mocks.useUpdateOpportunity.mockReturnValue({
      mutateAsync: mocks.update,
      isPending: false,
    })
    mocks.update.mockResolvedValue(opportunity)
  })

  it('renders the complete reference fixture on the official opportunity route', () => {
    renderDetail(ricardoMendesOpportunityId)

    expect(screen.getByRole('heading', { name: 'Ricardo Mendes' })).toBeVisible()
    expect(screen.getAllByText('Qualificação')).toHaveLength(2)
    expect(screen.getByText(/R\$\s*4\.800\/mês/)).toBeVisible()
    expect(screen.getByText('ricardo.mendes@email.com')).toBeVisible()
    expect(screen.getByText('Apt 3q Jardins (Moema / Pinheiros)')).toBeVisible()
    expect(screen.getByText('R$ 4.500 a R$ 5.500/mês')).toBeVisible()
    expect(screen.getByText('Imediato (Mudança em 30 dias)')).toBeVisible()

    ;['Apto Jardins Premium', 'Vila Mariana Unique', 'Pinheiros Office Spot'].forEach((title) =>
      expect(screen.getByText(title)).toBeVisible(),
    )
    ;['84% Match', '88% Match', '75% Match'].forEach((match) =>
      expect(screen.getByText(match)).toBeVisible(),
    )
    ;['Chamada telefônica', 'E-mail enviado', 'Oportunidade criada'].forEach((activity) =>
      expect(screen.getByText(activity)).toBeVisible(),
    )
    ;['Hoje, 11:15', 'Ontem, 16:30', '24 Set, 09:10'].forEach((date) =>
      expect(screen.getByText(date)).toBeVisible(),
    )
    expect(screen.getByText('Visita no Apto Jardins Premium')).toBeVisible()
    expect(screen.getByText('Follow-up da proposta e documentação')).toBeVisible()

    expect(screen.getByRole('button', { name: 'Mover para Proposta' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Descartar Lead' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Adicionar Nota Rápida' })).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Mais ações do lead' })).not.toBeInTheDocument()
  })

  it('builds the presentation from live opportunity and property data', () => {
    renderDetail()

    expect(screen.getByText('ricardo@example.com')).toBeVisible()
    expect(screen.getAllByText(/Apartamento Jardins/).length).toBeGreaterThan(0)
    expect(screen.getByText('Apartamento · 84m² · Jardins · São Paulo')).toBeVisible()
    expect(screen.getByText('Oportunidade criada')).toBeVisible()
    expect(screen.getByText('Oportunidade atualizada')).toBeVisible()
    expect(screen.getByText('Nenhuma próxima ação cadastrada')).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Imóveis Sugeridos' })).toBeVisible()
  })

  it('confirms and persists a status change through the existing mutation', async () => {
    const user = userEvent.setup()
    renderDetail()

    await user.click(screen.getByRole('button', { name: 'Mover de etapa' }))
    await user.click(screen.getByRole('menuitem', { name: 'Negociação' }))

    const dialog = screen.getByRole('dialog', { name: 'Confirmar mudança de etapa' })
    expect(within(dialog).getByText(/Proposta enviada para Negociação/)).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Confirmar mudança' }))

    await waitFor(() =>
      expect(mocks.update).toHaveBeenCalledWith({
        id: opportunity.id,
        changes: { status: 'EM_NEGOCIACAO' },
      }),
    )
    expect(mocks.enqueueSnackbar).toHaveBeenCalledWith('Oportunidade movida para Negociação.', {
      variant: 'success',
    })
  })

  it('requires confirmation before discarding a live lead', async () => {
    const user = userEvent.setup()
    renderDetail()

    await user.click(screen.getByRole('button', { name: 'Descartar Lead' }))
    expect(mocks.update).not.toHaveBeenCalled()

    const dialog = screen.getByRole('dialog', { name: 'Confirmar mudança de etapa' })
    expect(within(dialog).getByText(/Proposta enviada para Perdido/)).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Confirmar mudança' }))

    await waitFor(() =>
      expect(mocks.update).toHaveBeenCalledWith({
        id: opportunity.id,
        changes: { status: 'RECUSADA' },
      }),
    )
  })

  it('acknowledges the quick-note action without inventing persistence', async () => {
    const user = userEvent.setup()
    renderDetail()

    await user.click(screen.getByRole('button', { name: 'Adicionar Nota Rápida' }))

    expect(mocks.enqueueSnackbar).toHaveBeenCalledWith(
      'Notas rápidas estarão disponíveis em breve.',
      { variant: 'info' },
    )
  })

  it('shows loading and request error states', () => {
    mocks.useOpportunity.mockReturnValueOnce({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: mocks.refetchOpportunity,
    })
    const { rerender } = renderDetail()

    expect(screen.getByLabelText('Carregando oportunidade')).toBeInTheDocument()

    mocks.useOpportunity.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: mocks.refetchOpportunity,
    })
    rerender(
      <ThemeProvider theme={theme}>
        <OpportunityDetail opportunityId={opportunity.id} />
      </ThemeProvider>,
    )

    expect(screen.getByText('Não foi possível carregar esta oportunidade.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(mocks.refetchOpportunity).toHaveBeenCalled()
  })
})
