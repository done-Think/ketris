vi.mock('../../hooks/use-contacts', () => ({
  useCrmContactOptions: () => ({ data: [], isFetching: false }),
}))
import { ThemeProvider } from '@mui/material'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'

import { OpportunityDetail } from '../../components/OpportunityDetail'
import type { Opportunity } from '../../types/opportunity'
import type { CrmPropertyDetail } from '../../types/property'

const mocks = vi.hoisted(() => ({
  useOpportunity: vi.fn(),
  useOpportunityActivities: vi.fn(),
  useCrmAuthorizedProperty: vi.fn(),
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
  useOpportunityActivities: mocks.useOpportunityActivities,
  useCrmAuthorizedProperty: mocks.useCrmAuthorizedProperty,
  useUpdateOpportunity: mocks.useUpdateOpportunity,
  useArchiveOpportunity: mocks.useArchiveOpportunity,
}))

const opportunity: Opportunity = {
  id: 'opportunity-1',
  tenantId: 'tenant-1',
  contactId: null,
  propertyId: 'property-1',
  leadName: 'Ricardo Mendes',
  leadEmail: 'ricardo@example.com',
  leadPhone: '(11) 98722-1200',
  proposedValue: 4800,
  contractTermMonths: 30,
  desiredStartDate: '2026-09-01T00:00:00.000Z',
  guaranteeType: 'FIADOR',
  specialConditions: ['Aceita pets'],
  notes: 'Prefere visitas pela manhã.',
  status: 'ENVIADA',
  archivedAt: null,
  createdAt: '2026-08-10T10:00:00.000Z',
  updatedAt: '2026-08-12T10:00:00.000Z',
}

const property: CrmPropertyDetail = {
  id: 'property-1',
  title: 'Apartamento Jardins',
  purpose: 'ALUGUEL',
  propertyType: 'apartamento',
  price: 4500,
  condoFee: 800,
  propertyTax: null,
  bedrooms: 2,
  bathrooms: 2,
  parkingSpots: 1,
  area: 84,
  city: 'São Paulo',
  neighborhood: 'Jardins',
  latitude: null,
  longitude: null,
  brokerName: null,
  brokerAvatarUrl: null,
  coverUrl: null,
  publishedAt: '2026-08-01T10:00:00.000Z',
  description: null,
  address: null,
  media: [],
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
    mocks.useOpportunityActivities.mockReturnValue({ data: [], isLoading: false, isError: false })
    mocks.useOpportunity.mockReturnValue({
      data: opportunity,
      isLoading: false,
      isError: false,
      refetch: mocks.refetchOpportunity,
    })
    mocks.useCrmAuthorizedProperty.mockReturnValue({
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
      archivedAt: '2026-08-12T12:00:00.000Z',
    })
  })

  it('renders only real opportunity and associated property data', () => {
    renderDetail()

    expect(screen.getAllByText('Ricardo Mendes').length).toBeGreaterThan(0)
    expect(screen.getByText('ricardo@example.com')).toBeInTheDocument()
    expect(screen.getByText('Apartamento Jardins')).toBeInTheDocument()
    expect(screen.queryByText('Oportunidade atualizada')).not.toBeInTheDocument()
    expect(screen.queryByText('Oportunidade criada')).not.toBeInTheDocument()

    expect(screen.getByText('Alinhar retorno do proprietário')).toBeInTheDocument()
    expect(screen.getByText('Fazer follow-up da proposta')).toBeInTheDocument()
    expect(screen.getByText('Validar documentos')).toBeInTheDocument()
    expect(screen.getByText('Agendar visita ou chamada')).toBeInTheDocument()
    expect(screen.queryByText('Oportunidade criada')).not.toBeInTheDocument()
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
        leadName: opportunity.leadName,
        leadEmail: opportunity.leadEmail,
        proposedValue: opportunity.proposedValue,
        notes: 'Agendar retorno na sexta-feira.',
      }),
    })
    expect(mocks.enqueueSnackbar).toHaveBeenCalledWith('Oportunidade atualizada.', {
      variant: 'success',
    })
  })

  it('requires confirmation before soft-archiving', async () => {
    const user = userEvent.setup()
    renderDetail()

    await user.click(screen.getByRole('button', { name: 'Arquivar oportunidade' }))
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
  it('preserves unsaved edits through refetches and mutation-state changes', async () => {
    const user = userEvent.setup()
    const { rerender } = renderDetail()
    await user.click(screen.getByRole('button', { name: 'Editar dados' }))
    const notes = screen.getByLabelText('Observações')
    await user.clear(notes)
    await user.type(notes, 'Edição local ainda não salva')
    mocks.useOpportunity.mockReturnValue({
      data: { ...opportunity, notes: 'Nova versão no servidor' },
      isError: true,
      isLoading: false,
      refetch: mocks.refetchOpportunity,
    })
    rerender(
      <ThemeProvider theme={theme}>
        <OpportunityDetail opportunityId={opportunity.id} />
      </ThemeProvider>,
    )
    expect(screen.getByLabelText('Observações')).toHaveValue('Edição local ainda não salva')
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }))
    await waitFor(() =>
      expect(mocks.update).toHaveBeenCalledWith(
        expect.objectContaining({
          changes: expect.objectContaining({ notes: 'Edição local ainda não salva' }),
        }),
      ),
    )
  })

  it('preserves commas and line breaks inside separate special conditions', async () => {
    const conditions = ['Pets, mediante vistoria', 'Desconto inicial\nRevisão em janeiro']
    mocks.useOpportunity.mockReturnValue({
      data: { ...opportunity, specialConditions: conditions },
      isError: false,
      isLoading: false,
    })
    const user = userEvent.setup()
    renderDetail()
    await user.click(screen.getByRole('button', { name: 'Editar dados' }))
    expect(screen.getByLabelText('Condição 1')).toHaveValue(conditions[0])
    expect(screen.getByLabelText('Condição 2')).toHaveValue(conditions[1])
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }))
    await waitFor(() =>
      expect(mocks.update).toHaveBeenCalledWith(
        expect.objectContaining({
          changes: expect.objectContaining({ specialConditions: conditions }),
        }),
      ),
    )
  })

  it('renders the actual timeline and translates system statuses without inventing earlier activities', () => {
    mocks.useOpportunityActivities.mockReturnValue({
      data: [
        {
          id: 'real-activity',
          type: 'MUDANCA_STATUS',
          systemAction: 'STATUS_CHANGED',
          previousStatus: 'ENVIADA',
          newStatus: 'ACEITA',
          description: '',
          createdAt: '2026-10-25T12:00:00.000Z',
        },
      ],
      isLoading: false,
      isError: false,
    })
    renderDetail()
    expect(screen.getByText('Status alterado de Enviada para Aceita.')).toBeVisible()
    expect(screen.queryByText('Oportunidade criada')).not.toBeInTheDocument()
    expect(document.querySelectorAll('time')).toHaveLength(1)
  })

  it('disables transitions forbidden by the same backend state machine', () => {
    mocks.useOpportunity.mockReturnValue({
      data: { ...opportunity, status: 'ACEITA' },
      isError: false,
      isLoading: false,
    })
    renderDetail()
    expect(screen.getByRole('button', { name: 'Mover de etapa' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Descartar lead' })).toBeDisabled()
  })
})
