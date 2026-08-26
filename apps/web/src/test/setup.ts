import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

vi.mock('next-intl', () => ({
  useLocale: () => 'pt-BR',
  useTranslations: (namespace?: string) => {
    const messages: Record<string, string | ((values: Record<string, string>) => string)> = {
      'marketplace.header.announceProperty': 'Anunciar Imóvel',
      'marketplace.header.closeMenu': 'Fechar menu',
      'marketplace.header.mainMenu': 'Menu principal',
      'marketplace.header.notifications': 'notificações',
      'marketplace.header.openMenu': 'Abrir menu',
      'marketplace.header.openProfile': 'Abrir perfil',
      'marketplace.navigation.agencies': 'Imobiliárias',
      'marketplace.navigation.brokers': 'Corretores',
      'marketplace.navigation.buy': 'Comprar',
      'marketplace.navigation.home': 'Início',
      'marketplace.navigation.rent': 'Alugar',
      'marketplace.profile.actions.settings': 'Configurações',
      'marketplace.profile.actions.signOut': 'Sair',
      'marketplace.profile.actions.support': 'Suporte',
      'marketplace.profile.actions.switchMode': 'Trocar modalidade',
      'marketplace.profile.closeProfile': 'Fechar perfil',
      'marketplace.profile.dialogLabel': 'Perfil do usuário',
      'marketplace.profile.language': 'Idioma',
      'marketplace.profile.languages.en': 'Inglês',
      'marketplace.profile.languages.es': 'Espanhol',
      'marketplace.profile.languages.ptBR': 'Português',
      'marketplace.profile.role': 'Corretor parceiro',
      'marketplace.publicProfile.listings.title': 'Imóveis representados',
      'marketplace.publicProfile.listings.viewAriaLabel': ({ title }) => `Ver imóvel ${title}`,
      'marketplace.publicProfile.listings.viewProperty': 'Ver imóvel',
    }

    return (key: string, values: Record<string, string> = {}) => {
      const message = messages[namespace ? `${namespace}.${key}` : key]

      if (typeof message === 'function') return message(values)

      return message ?? key
    }
  },
}))

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
