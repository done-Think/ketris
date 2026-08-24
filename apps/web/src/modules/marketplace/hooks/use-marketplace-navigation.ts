import { useLocale, useTranslations } from 'next-intl'

import type { AppLocale } from '@/i18n/types/locale.types'
import type { MarketplaceNavigation, MarketplaceNavigationKey } from '../types/navigation'

export function useMarketplaceNavigation(): MarketplaceNavigation {
  const locale = useLocale() as AppLocale
  const t = useTranslations('marketplace')
  const hrefs = getMarketplaceHrefs(locale)

  return {
    homeNavigationItems: [
      { key: 'home', label: t('navigation.home'), href: hrefs.home },
      { key: 'rent', label: t('navigation.rent'), href: hrefs.rent },
      { key: 'buy', label: t('navigation.buy'), href: hrefs.buy },
      { key: 'brokers', label: t('navigation.brokers'), href: hrefs.brokers },
      { key: 'agencies', label: t('navigation.agencies'), href: hrefs.agencies },
    ],
    footerColumns: [
      {
        title: t('footer.columns.forYou'),
        links: [
          { label: t('footer.links.searchProperties'), href: hrefs.properties },
          { label: t('footer.links.favorites'), href: hrefs.properties },
          { label: t('footer.links.financialSimulator'), href: hrefs.properties },
        ],
      },
      {
        title: t('footer.columns.brokers'),
        links: [
          { label: t('footer.links.listProperty'), href: hrefs.login },
          { label: t('footer.links.partnerPortal'), href: hrefs.login },
          { label: t('footer.links.corporateSolutions'), href: hrefs.properties },
        ],
      },
      {
        title: t('footer.columns.company'),
        links: [
          { label: t('footer.links.aboutUs'), href: hrefs.home },
          { label: t('footer.links.contact'), href: hrefs.home },
          { label: t('footer.links.workWithUs'), href: hrefs.home },
        ],
      },
    ],
    legalLinks: [
      { label: t('footer.links.termsOfUse'), href: hrefs.home },
      { label: t('footer.links.privacyPolicy'), href: hrefs.home },
    ],
  }
}

function getMarketplaceHrefs(
  locale: AppLocale,
): Record<MarketplaceNavigationKey | 'properties' | 'login', string> {
  if (locale === 'en-US') {
    return {
      home: '/en',
      rent: '/en/properties?finalidade=alugar',
      buy: '/en/properties?finalidade=comprar',
      brokers: '/en/brokers',
      agencies: '/en/agencies',
      properties: '/en/properties',
      login: '/en/login',
    }
  }

  if (locale === 'es-ES') {
    return {
      home: '/es',
      rent: '/es/inmuebles?finalidade=alugar',
      buy: '/es/inmuebles?finalidade=comprar',
      brokers: '/es/corredores',
      agencies: '/es/inmobiliarias',
      properties: '/es/inmuebles',
      login: '/es/login',
    }
  }

  return {
    home: '/',
    rent: '/imoveis?finalidade=alugar',
    buy: '/imoveis?finalidade=comprar',
    brokers: '/corretores',
    agencies: '/imobiliarias',
    properties: '/imoveis',
    login: '/login',
  }
}
