import { fireEvent, render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PropertyFullHistory } from '../../components/PropertyFullHistory'
import type { PropertyHistoryEvent } from '../../types/property-history'

const state = vi.hoisted(() => ({ page: 1, totalPages: 1, list: vi.fn() }))
const events: PropertyHistoryEvent[] = [
  {
    id: 'ana',
    action: 'UPDATED',
    actorName: 'Ana',
    actorRole: 'AGENT',
    createdAt: '2026-11-12T12:00:00Z',
    fields: ['price'],
    changes: [{ field: 'price', before: 1000, after: 1500 }],
  },
  {
    id: 'carlos',
    action: 'UPDATED',
    actorName: 'Carlos',
    actorRole: 'AGENT',
    createdAt: '2026-11-11T12:00:00Z',
    fields: ['description'],
    changes: [{ field: 'description', before: 'Anterior', after: 'Descrição do Carlos' }],
  },
]
const older: PropertyHistoryEvent = {
  id: 'old',
  action: 'CREATED',
  actorName: 'Maria',
  actorRole: 'OWNER',
  createdAt: '2026-11-01T12:00:00Z',
  fields: ['title'],
  changes: [{ field: 'title', before: null, after: 'Casa original' }],
}
vi.mock('../../hooks/use-property-history', () => ({
  usePropertyHistory: (_id: string, page: number) => {
    state.page = page
    state.list()
    return {
      data: { events: page === 1 ? events : [older], pagination: { totalPages: state.totalPages } },
      isLoading: false,
      isError: false,
    }
  },
  usePropertyHistoryEvent: (_id: string, eventId: string) => ({
    data: [...events, older].find((event) => event.id === eventId),
    isLoading: false,
    isError: false,
  }),
}))
beforeEach(() => {
  state.page = 1
  state.totalPages = 1
  vi.clearAllMocks()
})

describe('full property change history', () => {
  it('updates the timeline selection when scrolling forward and back through updates', async () => {
    render(<PropertyFullHistory propertyId="property" legacy={[]} />)
    await userEvent.click(screen.getByRole('button', { name: 'Exibir todo histórico' }))
    const dialog = screen.getByRole('dialog')
    const articles = within(dialog).getAllByRole('article')
    const container = articles[0].parentElement!.parentElement!
    let position = 0
    vi.spyOn(container, 'getBoundingClientRect').mockImplementation(() => ({ top: 0 }) as DOMRect)
    Object.defineProperty(container, 'clientHeight', { configurable: true, value: 500 })
    vi.spyOn(articles[0], 'getBoundingClientRect').mockImplementation(
      () => ({ top: 40 - position }) as DOMRect,
    )
    vi.spyOn(articles[1], 'getBoundingClientRect').mockImplementation(
      () => ({ top: 600 - position }) as DOMRect,
    )
    const timeline = within(dialog).getByRole('complementary')
    const ana = within(timeline).getByRole('button', { name: /por Ana/ })
    const carlos = within(timeline).getByRole('button', { name: /por Carlos/ })
    expect(ana).toHaveAttribute('aria-current', 'step')
    position = 550
    fireEvent.scroll(container)
    expect(carlos).toHaveAttribute('aria-current', 'step')
    expect(ana).not.toHaveAttribute('aria-current')
    position = 0
    fireEvent.scroll(container)
    expect(ana).toHaveAttribute('aria-current', 'step')
    expect(carlos).not.toHaveAttribute('aria-current')
  })
  it('opens on demand with separate event cards and a navigable side timeline', async () => {
    const scroll = vi.fn()
    const original = HTMLElement.prototype.scrollIntoView
    HTMLElement.prototype.scrollIntoView = scroll
    try {
      render(<PropertyFullHistory propertyId="property" legacy={[]} />)
      expect(state.list).not.toHaveBeenCalled()
      await userEvent.click(screen.getByRole('button', { name: 'Exibir todo histórico' }))
      const dialog = screen.getByRole('dialog', { name: 'Histórico completo de mudanças' })
      const articles = within(dialog).getAllByRole('article')
      expect(articles).toHaveLength(2)
      expect(within(articles[0]).getByText(/1\.500,00/)).toBeVisible()
      expect(within(articles[0]).queryByText('Descrição do Carlos')).not.toBeInTheDocument()
      expect(within(articles[1]).getByText('Descrição do Carlos')).toBeVisible()
      expect(within(articles[1]).queryByText(/1\.500,00/)).not.toBeInTheDocument()
      const timeline = within(dialog).getByRole('complementary', { name: 'Linha do tempo' })
      const button = within(timeline).getByRole('button', { name: /Imóvel atualizado por Carlos/ })
      await userEvent.click(button)
      expect(scroll).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' })
      expect(button).toHaveAttribute('aria-current', 'step')
      expect(articles[1]).toHaveFocus()
      await userEvent.click(within(dialog).getByRole('button', { name: 'Fechar' }))
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    } finally {
      HTMLElement.prototype.scrollIntoView = original
    }
  })
  it('keeps older updates accessible through pagination', async () => {
    state.totalPages = 2
    render(<PropertyFullHistory propertyId="property" legacy={[]} />)
    await userEvent.click(screen.getByRole('button', { name: 'Exibir todo histórico' }))
    const dialog = screen.getByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Go to page 2' }))
    expect(state.page).toBe(2)
    expect(within(dialog).getAllByRole('article')).toHaveLength(1)
    expect(within(dialog).getByText('Casa original')).toBeVisible()
    expect(within(dialog).queryByText('Descrição do Carlos')).not.toBeInTheDocument()
  })
})
