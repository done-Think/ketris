import { ThemeProvider } from '@mui/material'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'

import { OpportunityDetail } from '../../components/OpportunityDetail'
import type { Opportunity } from '../../types/opportunity'
import type { PublicPropertyDetail } from '../../types/property'

const mocks = vi.hoisted(() => ({
  useOpportunity: vi.fn(),
  useCrmProperty: vi.fn(),
  useUpdateOpportunity: vi.fn(),
  useArchiveOpportunity: vi.fn(),
  update: vi.fn(),
  archive: vi.fn(),
  refetchOpportunity: vi.fn(),
  refetchProperty: vi.fn(),
  enqueueSnackbar: vi.fn(),
  replace: vi.fn(),
}))

vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: { tenantId: 'tenant-1', scope: 'tenant', user: { id: 'user-1' } },
    status: 'authenticated',
  }),
}))

vi.mock('@/i18n/navigation', async () => {
  const React = await import('react')

  return {
    useRouter: () => ({ replace: mocks.replace }),
    Link: React.forwardRef<HTMLAnchorElement, React.AnchorHTMLAttributes<HTMLAnchorElement>>(
      function MockLocalizedLink({ href = '', ...props }, ref) {
        return React.createElement('a', { ...props, href, ref })
      },
    ),
  }
})

vi.mock('notistack', () => ({
  useSnackbar: () => ({ enqueueSnackbar: mocks.enqueueSnackbar }),
}))

vi.mock('../../hooks/use-opportunities', () => ({
  useOpportunity: mocks.useOpportunity,
  useCrmProperty: mocks.useCrmProperty,
  useUpdateOpportunity: mocks.useUpdateOpportunity,
  useArchiveOpportunity: mocks.useArchiveOpportunity,
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
  tipo: 'apartamento',
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

function renderDetail() {
  return render(
    <ThemeProvider theme={theme}>
      <OpportunityDetail opportunityId={opportunity.id} />
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
    mocks.useArchiveOpportunity.mockReturnValue({
      mutateAsync: mocks.archive,
      isPending: false,
    })
    mocks.update.mockResolvedValue(opportunity)
    mocks.archive.mockResolvedValue({
      ...opportunity,
      arquivadaEm: '2026-08-12T12:00:00.000Z',
    })
  })

  it('renders only real opportunity and associated property data', () => {
    renderDetail()

    expect(screen.getAllByText('Ricardo Mendes').length).toBeGreaterThan(0)
    expect(screen.getByText('ricardo@example.com')).toBeInTheDocument()
    expect(screen.getByText('Apartamento Jardins')).toBeInTheDocument()
    expect(screen.getByText(/R\$\s*4\.800\/mês/)).toBeInTheDocument()
    expect(screen.getByText('Oportunidade criada')).toBeInTheDocument()
    expect(screen.getByText('Oportunidade atualizada')).toBeInTheDocument()
    expect(screen.getByText('Nenhuma próxima ação cadastrada')).toBeInTheDocument()
    expect(screen.queryByText(/imóveis sugeridos/i)).not.toBeInTheDocument()
  })

  it('confirms and persists a status change through PATCH', async () => {
    const user = userEvent.setup()
    renderDetail()

    await user.click(screen.getByRole('button', { name: /mover de etapa/i }))
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

  it('edits API-compatible fields and observations', async () => {
    const user = userEvent.setup()
    renderDetail()

    await user.click(screen.getByRole('button', { name: 'Editar dados' }))
    const dialog = screen.getByRole('dialog', { name: 'Editar oportunidade' })
    const observations = within(dialog).getByLabelText('Observações')
    fireEvent.change(observations, { target: { value: 'Agendar retorno na sexta-feira.' } })
    await user.click(within(dialog).getByRole('button', { name: 'Salvar alterações' }))

    await waitFor(() => expect(mocks.update).toHaveBeenCalledTimes(1))
    expect(mocks.update).toHaveBeenCalledWith({
      id: opportunity.id,
      changes: expect.objectContaining({
        interessadoNome: opportunity.interessadoNome,
        interessadoEmail: opportunity.interessadoEmail,
        valorProposto: opportunity.valorProposto,
        observacoes: 'Agendar retorno na sexta-feira.',
      }),
    })
    expect(mocks.enqueueSnackbar).toHaveBeenCalledWith('Oportunidade atualizada.', {
      variant: 'success',
    })
  })

  it('requires confirmation before soft-archiving', async () => {
    const user = userEvent.setup()
    renderDetail()

    await user.click(screen.getByRole('button', { name: 'Arquivar' }))
    expect(mocks.archive).not.toHaveBeenCalled()

    const dialog = screen.getByRole('dialog', { name: 'Arquivar oportunidade?' })
    await user.click(within(dialog).getByRole('button', { name: 'Arquivar oportunidade' }))

    await waitFor(() => expect(mocks.archive).toHaveBeenCalledWith(opportunity.id))
    expect(mocks.replace).toHaveBeenCalledWith('/crm')
    expect(mocks.enqueueSnackbar).toHaveBeenCalledWith('Oportunidade arquivada.', {
      variant: 'success',
    })
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
