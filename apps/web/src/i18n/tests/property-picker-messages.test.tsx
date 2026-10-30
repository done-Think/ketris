import { cloneElement, type ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { getMessages } from 'next-intl/server'
import PropertiesLayout from '@/app/[locale]/(dashboard)/dashboard/properties/layout'
import { CrmAutocomplete } from '@modules/crm/components/CrmAutocomplete'
import { ScopedMessages } from '../scoped-messages'
import { defaultTimeZone } from '../formats'

// The global test translator includes every catalog and hides missing route namespaces.
vi.unmock('next-intl')
vi.mock('next-intl/server', () => ({ getMessages: vi.fn() }))

async function renderPropertyRoute(locale: 'pt-BR' | 'en-US' | 'es-ES', children: ReactNode) {
  const namespaces = ['common', 'marketplace', 'dashboard', 'agenda', 'properties', 'crm']
  const catalog = Object.fromEntries(
    await Promise.all(
      namespaces.map(async (namespace) => [
        namespace,
        (await import(`../messages/${locale}/${namespace}.json`)).default,
      ]),
    ),
  )
  vi.mocked(getMessages).mockResolvedValueOnce(catalog)
  const route = PropertiesLayout({ children })
  const provider = await ScopedMessages(route.props)
  const onError = vi.fn()
  render(cloneElement(provider, { locale, timeZone: defaultTimeZone, onError }))
  return { copy: catalog.crm.autocomplete, onError }
}

const baseProps = {
  value: null,
  options: [] as { id: string; name: string }[],
  onChange: vi.fn(),
  onSearch: vi.fn(),
  getOptionLabel: (option: { id: string; name: string }) => option.name,
  label: 'Owner',
  loading: false,
  onLoadMore: vi.fn(),
  onRetry: vi.fn(),
}

describe('property route contact picker translations', () => {
  it.each(['pt-BR', 'en-US', 'es-ES'] as const)(
    'translates empty results and popup controls in %s with the real route messages',
    async (locale) => {
      const user = userEvent.setup()
      const { copy, onError } = await renderPropertyRoute(
        locale,
        <CrmAutocomplete {...baseProps} />,
      )
      await user.click(screen.getByRole('button', { name: copy.open }))
      expect(screen.getByText(copy.empty)).toBeVisible()
      expect(screen.getByRole('button', { name: copy.close })).toBeVisible()
      expect(onError).not.toHaveBeenCalled()
    },
  )

  it.each(['pt-BR', 'en-US', 'es-ES'] as const)(
    'translates loading, failure and pagination messages in %s',
    async (locale) => {
      const user = userEvent.setup()
      const onRetry = vi.fn()
      const onLoadMore = vi.fn()
      const { copy, onError } = await renderPropertyRoute(
        locale,
        <CrmAutocomplete
          {...baseProps}
          loading
          loadError
          hasNextPage
          onRetry={onRetry}
          onLoadMore={onLoadMore}
        />,
      )
      expect(screen.getByRole('alert')).toHaveTextContent(copy.loadError)
      await user.click(screen.getByRole('button', { name: copy.retry }))
      expect(onRetry).toHaveBeenCalledOnce()
      await user.click(screen.getByRole('button', { name: copy.loadMore }))
      expect(onLoadMore).toHaveBeenCalledOnce()
      await user.click(screen.getByRole('combobox', { name: 'Owner' }))
      expect(screen.getByText(copy.loading)).toBeVisible()
      expect(onError).not.toHaveBeenCalled()
    },
  )
})
