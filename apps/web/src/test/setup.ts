import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

import { defaultTimeZone, formats } from '@/i18n/formats'
import { defaultLocale } from '@/i18n/routing'

async function loadRealMessages() {
  const locale = defaultLocale
  const namespaces = [
    'common',
    'auth',
    'crm',
    'dashboard',
    'marketplace',
    'platform',
    'properties',
    'validation',
  ] as const

  const loaded = await Promise.all(
    namespaces.map((namespace) => import(`@/i18n/messages/${locale}/${namespace}.json`)),
  )

  return {
    locale,
    timeZone: defaultTimeZone,
    messages: Object.fromEntries(
      namespaces.map((namespace, index) => [namespace, loaded[index].default]),
    ),
  }
}

// Usa o próprio next-intl sobre os arquivos de mensagem reais, em vez de um dicionário
// paralelo. Um mock com mensagens hardcoded devolve `key` para chaves inexistentes e nunca
// carrega os JSON entregues em produção — foi o que deixou passar tanto chaves inválidas
// quanto traduções ausentes. Aqui uma chave errada quebra o teste, como deve.
vi.mock('next-intl', async () => {
  const actual = await vi.importActual<typeof import('next-intl')>('next-intl')
  const { messages, locale, timeZone } = await loadRealMessages()

  return {
    ...actual,
    useLocale: () => locale,
    useTranslations: (namespace?: string) =>
      actual.createTranslator({ locale, messages, namespace, formats }),
    useFormatter: () => actual.createFormatter({ locale, timeZone, formats }),
  }
})

vi.mock('@/i18n/navigation', async () => {
  const React = await import('react')

  function formatHref(
    href:
      | string
      | { pathname: string; params?: Record<string, string>; query?: Record<string, string> },
  ) {
    if (typeof href === 'string') return href

    const pathname = href.params
      ? Object.entries(href.params).reduce(
          (currentPathname, [key, value]) => currentPathname.replace(`[${key}]`, value),
          href.pathname,
        )
      : href.pathname
    const localizedPathname = pathname
      .replace(/^\/properties(?=\/|$)/, '/imoveis')
      .replace(/^\/brokers(?=\/|$)/, '/corretores')
      .replace(/^\/agencies(?=\/|$)/, '/imobiliarias')
    const query = href.query ? new URLSearchParams(href.query).toString() : ''

    return query ? `${localizedPathname}?${query}` : localizedPathname
  }

  return {
    usePathname: () => '/',
    useRouter: () => ({
      back: vi.fn(),
      forward: vi.fn(),
      prefetch: vi.fn(),
      push: vi.fn(),
      refresh: vi.fn(),
      replace: vi.fn(),
    }),
    Link: React.forwardRef<HTMLAnchorElement, React.AnchorHTMLAttributes<HTMLAnchorElement>>(
      function MockLocalizedLink({ href = '', ...props }, ref) {
        return React.createElement('a', { ...props, href: formatHref(href), ref })
      },
    ),
  }
})

afterEach(() => {
  cleanup()
})
