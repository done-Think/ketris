import { useTranslations } from 'next-intl'

import type { LocalizedHref } from '@shared/types/localized-href'
import type { MarketplaceNavigation, MarketplaceNavigationHrefKey } from '../types/navigation'

export function useMarketplaceNavigation(): MarketplaceNavigation {
  const t = useTranslations('marketplace')
  const hrefs = getMarketplaceHrefs()

  return {
    homeNavigationItems: [
      { id: 'home', label: t('navigation.home'), href: hrefs.home },
      { id: 'rent', label: t('navigation.rent'), href: hrefs.rent },
      { id: 'buy', label: t('navigation.buy'), href: hrefs.buy },
      { id: 'brokers', label: t('navigation.brokers'), href: hrefs.brokers },
      { id: 'agencies', label: t('navigation.agencies'), href: hrefs.agencies },
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

function getMarketplaceHrefs(): Record<MarketplaceNavigationHrefKey, LocalizedHref> {
  return {
    home: '/',
    rent: { pathname: '/properties', query: { purpose: 'rent' } },
    buy: { pathname: '/properties', query: { purpose: 'buy' } },
    brokers: '/brokers',
    agencies: '/agencies',
    properties: '/properties',
    login: '/login',
  }
}
