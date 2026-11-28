import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PropertyHistory } from '../../components/PropertyHistory'
import type { PropertyHistoryEvent } from '../../types/property-history'

const state = vi.hoisted(() => ({
  isError: false,
  detailError: false,
  page: 1,
  totalPages: 1,
  multiple: false,
  staleDetail: false,
}))
const event: PropertyHistoryEvent = {
  id: 'event',
  action: 'UPDATED',
  actorName: 'Ana Corretora',
  actorRole: 'AGENT',
  createdAt: '2026-11-11T12:00:00.000Z',
  fields: ['price', 'owner', 'media', 'listing.negotiationConditions', 'brokers'],
  changes: [
    { field: 'brokers', before: [], after: [{ id: 'private-broker-id', name: 'Bruno Corretor' }] },
    { field: 'listing.negotiationConditions', before: [], after: ['ACCEPTS_FINANCING'] },
    { field: 'price', before: 400000, after: 420000 },
    {
      field: 'owner',
      before: { id: 'private-id-one', name: 'Maria' },
      after: { id: 'private-id-two', name: 'José' },
    },
    {
      field: 'media',
      before: [{ url: '/old.jpg', type: 'photo', position: 0 }],
      after: [{ url: '/new.jpg', type: 'photo', position: 0 }],
    },
  ],
}
const secondEvent: PropertyHistoryEvent = {
  id: 'second-event',
  action: 'UPDATED',
  actorName: 'Carlos Corretor',
  actorRole: 'AGENT',
  createdAt: '2026-11-12T12:00:00.000Z',
  fields: ['description'],
  changes: [{ field: 'description', before: 'Descrição anterior', after: 'Descrição do Carlos' }],
}
vi.mock('../../hooks/use-property-history', () => ({
  usePropertyHistory: (_id: string, page: number) => {
    state.page = page
    return {
      data: {
        events: state.multiple ? [event, secondEvent] : [event],
        pagination: { totalPages: state.totalPages },
      },
      isLoading: false,
      isError: state.isError,
      refetch: vi.fn(),
    }
  },
  usePropertyHistoryEvent: (_id: string, selected: string | null) => ({
    data:
      selected && !state.detailError
        ? selected === secondEvent.id && !state.staleDetail
          ? secondEvent
          : event
        : undefined,
    isLoading: selected === secondEvent.id && state.staleDetail,
    isError: state.detailError,
    refetch: vi.fn(),
  }),
}))
beforeEach(() => {
  state.isError = false
  state.detailError = false
  state.page = 1
  state.totalPages = 1
  state.multiple = false
  state.staleDetail = false
})
describe('clickable property history', () => {
  it('shows only the fields and author of the selected update', async () => {
    state.multiple = true
    render(<PropertyHistory propertyId="property" legacy={[]} />)
    await userEvent.click(
      screen.getByRole('button', { name: /Imóvel atualizado por Ana Corretora/ }),
    )
    let dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText(/420\.000,00/)).toBeVisible()
    expect(within(dialog).queryByText('Descrição do Carlos')).not.toBeInTheDocument()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Fechar' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await userEvent.click(
      screen.getByRole('button', { name: /Imóvel atualizado por Carlos Corretor/ }),
    )
    dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('Descrição do Carlos')).toBeVisible()
    expect(within(dialog).queryByText(/420\.000,00/)).not.toBeInTheDocument()
    expect(within(dialog).queryByText(/Ana Corretora/)).not.toBeInTheDocument()
  })
  it('does not display a previous event while the selected event loads', async () => {
    state.multiple = true
    state.staleDetail = true
    const view = render(<PropertyHistory propertyId="property" legacy={[]} />)
    await userEvent.click(
      screen.getByRole('button', { name: /Imóvel atualizado por Carlos Corretor/ }),
    )
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByRole('progressbar')).toBeVisible()
    expect(within(dialog).queryByText(/Ana Corretora/)).not.toBeInTheDocument()
    expect(within(dialog).queryByText(/420\.000,00/)).not.toBeInTheDocument()
    state.staleDetail = false
    view.rerender(<PropertyHistory propertyId="property" legacy={[]} />)
    expect(within(dialog).getByText('Descrição do Carlos')).toBeVisible()
  })
  it('opens the selected event with author, before and after values and the old and new cover', async () => {
    render(<PropertyHistory propertyId="property" legacy={[]} />)
    await userEvent.click(
      screen.getByRole('button', { name: /Imóvel atualizado por Ana Corretora/ }),
    )
    const dialog = screen.getByRole('dialog', { name: 'Detalhes da alteração' })
    expect(within(dialog).getByText(/Ana Corretora/)).toBeVisible()
    expect(within(dialog).getByText(/400\.000,00/)).toBeVisible()
    expect(within(dialog).getByText(/420\.000,00/)).toBeVisible()
    expect(within(dialog).getByText('Maria')).toBeVisible()
    expect(within(dialog).getByText('José')).toBeVisible()
    expect(within(dialog).getByText('Bruno Corretor')).toBeVisible()
    expect(within(dialog).queryByText('private-broker-id')).not.toBeInTheDocument()
    expect(within(dialog).getByText('Condições de negociação')).toBeVisible()
    expect(within(dialog).getByText('Aceita financiamento')).toBeVisible()
    expect(within(dialog).queryByText('ACCEPTS_FINANCING')).not.toBeInTheDocument()
    expect(within(dialog).getAllByRole('img')).toHaveLength(2)
    expect(screen.queryByText('private-id-one')).not.toBeInTheDocument()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Fechar' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })
  it('keeps older reference dates on the final page of the same timeline', async () => {
    state.totalPages = 2
    render(
      <PropertyHistory
        propertyId="property"
        legacy={[
          {
            label: 'Cadastro antigo',
            date: 'há 2 anos',
            tone: 'neutral',
            action: 'CREATED',
            occurredAt: '2024-01-01T12:00:00Z',
          },
        ]}
      />,
    )
    expect(screen.queryByText(/Cadastro antigo/)).not.toBeInTheDocument()
    expect(screen.queryByText('Resumo das datas do cadastro')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cadastro antigo' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Go to page 2' }))
    expect(state.page).toBe(2)
    expect(screen.getByText('Cadastro antigo')).toBeVisible()
    expect(screen.queryByRole('button', { name: /Cadastro antigo/ })).not.toBeInTheDocument()
  })
  it('uses one timeline without duplicating the updated snapshot or a separate action link', async () => {
    render(
      <PropertyHistory
        propertyId="property"
        compact
        legacy={[
          {
            action: 'UPDATED',
            occurredAt: event.createdAt,
            label: 'Imóvel atualizado',
            date: 'agora',
            tone: 'info',
          },
          {
            action: 'PUBLISHED',
            occurredAt: '2026-11-10T12:00:00Z',
            label: 'Imóvel publicado',
            date: 'ontem',
            tone: 'success',
          },
          {
            action: 'CREATED',
            occurredAt: '2026-11-09T12:00:00Z',
            label: 'Cadastro do imóvel efetuado',
            date: 'há 2 dias',
            tone: 'neutral',
          },
        ]}
      />,
    )
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
    expect(screen.getAllByText(/Imóvel atualizado/)).toHaveLength(1)
    expect(screen.queryByText('Ver alterações')).not.toBeInTheDocument()
    expect(screen.queryByText('Resumo das datas do cadastro')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /Imóvel atualizado por Ana Corretora/ }),
    ).not.toBeInTheDocument()
    await userEvent.click(screen.getByText(/Imóvel atualizado por Ana Corretora/))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
  it('reports unavailable history without presenting a failed request as an empty history', () => {
    state.isError = true
    render(<PropertyHistory propertyId="property" legacy={[]} />)
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Não foi possível carregar o histórico de alterações.',
    )
    expect(screen.queryByText('Nenhuma alteração registrada.')).not.toBeInTheDocument()
  })
})
