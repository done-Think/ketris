import { ThemeProvider } from '@mui/material'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useSession } from 'next-auth/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'

import { useOpportunities } from '../hooks/use-opportunities'
import type { Opportunity } from '../types/opportunity'
import { ContactsList } from './ContactsList'

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}))

vi.mock('../hooks/use-opportunities', () => ({
  useOpportunities: vi.fn(),
}))

function makeOpportunity(index: number, overrides: Partial<Opportunity> = {}): Opportunity {
  return {
    id: `opportunity-${index}`,
    tenantId: 'tenant-1',
    imovelId: `property-${index}`,
    interessadoNome: `Contato ${index}`,
    interessadoEmail: `contact${index}@example.com`,
    interessadoTelefone: `(11) 90000-000${index}`,
    valorProposto: 4000 + index,
    prazoContratoMeses: null,
    inicioPretendido: null,
    garantiaContratual: 'NENHUMA',
    condicoesEspeciais: [],
    observacoes: null,
    status: 'ENVIADA',
    arquivadaEm: null,
    createdAt: `2026-08-${String(index).padStart(2, '0')}T10:00:00.000Z`,
    updatedAt: `2026-08-${String(index).padStart(2, '0')}T10:00:00.000Z`,
    ...overrides,
  }
}

function mockQuery(overrides: Record<string, unknown> = {}) {
  vi.mocked(useOpportunities).mockReturnValue({
    data: [],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useOpportunities>)
}

function renderContactsList() {
  return render(
    <ThemeProvider theme={theme}>
      <ContactsList />
    </ThemeProvider>,
  )
}

describe('ContactsList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useSession).mockReturnValue({
      data: { tenantId: 'tenant-1' },
      status: 'authenticated',
      update: vi.fn(),
    } as unknown as ReturnType<typeof useSession>)
  })

  it('renders one contact per normalized e-mail and links to its latest opportunity', () => {
    mockQuery({
      data: [
        makeOpportunity(1, {
          id: 'older-opportunity',
          imovelId: 'property-1',
          interessadoNome: 'Maria Silva',
          interessadoEmail: 'MARIA@example.com',
        }),
        makeOpportunity(2, {
          id: 'latest-opportunity',
          imovelId: 'property-2',
          interessadoNome: 'Maria Silva',
          interessadoEmail: ' maria@example.com ',
        }),
      ],
    })

    renderContactsList()

    const table = screen.getByRole('table', { name: 'Contatos do CRM' })
    const row = within(table).getByText('maria@example.com').closest('tr')

    expect(row).not.toBeNull()
    expect(within(row!).getByText('2')).toBeInTheDocument()
    expect(within(table).getAllByText('Maria Silva')).toHaveLength(1)
    expect(
      within(row!).getByRole('link', { name: 'Abrir oportunidade de Maria Silva' }),
    ).toHaveAttribute('href', '/crm/oportunidades/latest-opportunity')
  })

  it('filters contacts by name, e-mail, or phone', async () => {
    const user = userEvent.setup()
    mockQuery({ data: [makeOpportunity(1), makeOpportunity(2)] })
    renderContactsList()
    const table = screen.getByRole('table', { name: 'Contatos do CRM' })

    await user.type(screen.getByRole('textbox', { name: 'Buscar contatos' }), 'contact2@')

    expect(within(table).getByText('Contato 2')).toBeInTheDocument()
    expect(within(table).queryByText('Contato 1')).not.toBeInTheDocument()
  })

  it('requests the selected status through the tenant-scoped hook', async () => {
    const user = userEvent.setup()
    mockQuery({ data: [makeOpportunity(1)] })
    renderContactsList()

    await user.click(screen.getByRole('combobox', { name: 'Etapa' }))
    await user.click(screen.getByRole('option', { name: 'Negociação' }))

    expect(useOpportunities).toHaveBeenLastCalledWith('tenant-1', {
      status: 'EM_NEGOCIACAO',
    })
  })

  it('paginates contacts in groups of six', async () => {
    const user = userEvent.setup()
    mockQuery({ data: Array.from({ length: 7 }, (_, index) => makeOpportunity(index + 1)) })
    renderContactsList()
    const table = screen.getByRole('table', { name: 'Contatos do CRM' })

    expect(screen.getByText('Mostrando 1-6 de 7')).toBeInTheDocument()
    expect(within(table).getByText('Contato 7')).toBeInTheDocument()
    expect(within(table).queryByText('Contato 1')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Próxima página' }))

    expect(screen.getByText('Mostrando 7-7 de 7')).toBeInTheDocument()
    expect(within(table).getByText('Contato 1')).toBeInTheDocument()
    expect(within(table).queryByText('Contato 7')).not.toBeInTheDocument()
  })

  it('renders loading and empty states', () => {
    mockQuery({ isLoading: true })
    const { rerender } = renderContactsList()

    expect(screen.getByRole('progressbar', { name: 'Carregando contatos' })).toBeInTheDocument()

    mockQuery()
    rerender(
      <ThemeProvider theme={theme}>
        <ContactsList />
      </ThemeProvider>,
    )

    expect(screen.getByText('Nenhum contato encontrado')).toBeInTheDocument()
  })

  it('renders an error state and retries the query', () => {
    const refetch = vi.fn()
    mockQuery({ isError: true, refetch })
    renderContactsList()

    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(refetch).toHaveBeenCalledOnce()
  })

  it('keeps contact creation unavailable without a contact endpoint', () => {
    mockQuery()
    renderContactsList()

    expect(screen.getByRole('button', { name: 'Novo contato' })).toBeDisabled()
  })
})
