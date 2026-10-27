import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { useDirectoryList } from '../../hooks/use-directory-list'
import type { DirectoryPage, DirectoryQuery } from '../../types/directory'

type ApiItem = { id: string }

const observers: { callback: IntersectionObserverCallback; disconnect: () => void }[] = []

class MockIntersectionObserver {
  readonly disconnect = vi.fn()
  readonly observe = vi.fn()
  readonly unobserve = vi.fn()

  constructor(readonly callback: IntersectionObserverCallback) {
    observers.push(this)
  }
}

function intersect() {
  const observer = observers.at(-1)
  act(() =>
    observer?.callback(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      observer as unknown as IntersectionObserver,
    ),
  )
}

const fetchPage = vi.fn(
  async ({ q, page, pageSize }: DirectoryQuery): Promise<DirectoryPage<ApiItem>> => {
    const total = q ? 1 : 5
    const start = (page - 1) * pageSize
    const ids = Array.from({ length: total }, (_, index) => `${q ?? 'item'}-${index + 1}`)

    return {
      items: ids.slice(start, start + pageSize).map((id) => ({ id })),
      totalCount: total,
      page,
      pageSize,
    }
  },
)

function Directory() {
  const { items, totalCount, hasMoreItems, loadMoreRef, search, setSearch } = useDirectoryList({
    queryKey: (filters) => ['directory', filters],
    fetchPage,
    toItem: (item: ApiItem) => item.id.toUpperCase(),
    pageSize: 2,
  })

  return (
    <>
      <input
        aria-label="busca"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      <p data-testid="items">{items.join(',')}</p>
      <p data-testid="total">{totalCount}</p>
      {hasMoreItems ? <div ref={loadMoreRef} data-testid="sentinel" /> : null}
    </>
  )
}

function renderDirectory() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )

  return render(<Directory />, { wrapper })
}

beforeEach(() => {
  observers.length = 0
  fetchPage.mockClear()
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
})

afterEach(() => vi.unstubAllGlobals())

it('carrega a próxima página quando o sentinela entra na tela e para no total', async () => {
  renderDirectory()

  await waitFor(() => expect(screen.getByTestId('items')).toHaveTextContent('ITEM-1,ITEM-2'))
  expect(screen.getByTestId('total')).toHaveTextContent('5')
  expect(fetchPage).toHaveBeenCalledWith({ q: undefined, page: 1, pageSize: 2 })

  intersect()
  await waitFor(() =>
    expect(screen.getByTestId('items')).toHaveTextContent('ITEM-1,ITEM-2,ITEM-3,ITEM-4'),
  )

  intersect()
  await waitFor(() => expect(screen.getByTestId('items')).toHaveTextContent('ITEM-5'))
  expect(screen.queryByTestId('sentinel')).not.toBeInTheDocument()
  expect(fetchPage).toHaveBeenCalledTimes(3)
})

it('busca no servidor com o termo debounced e recomeça da primeira página', async () => {
  renderDirectory()
  await waitFor(() => expect(screen.getByTestId('total')).toHaveTextContent('5'))

  fireEvent.change(screen.getByLabelText('busca'), { target: { value: '  marina ' } })

  await waitFor(() => expect(screen.getByTestId('items')).toHaveTextContent('MARINA-1'))
  expect(fetchPage).toHaveBeenLastCalledWith({ q: 'marina', page: 1, pageSize: 2 })
  expect(screen.getByTestId('total')).toHaveTextContent('1')
})
