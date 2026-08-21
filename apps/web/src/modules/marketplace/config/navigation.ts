import { publicMarketplaceText } from '@shared/i18n/pt-br'

import type { FooterColumn } from '../types/footer'

const { footer, navigation } = publicMarketplaceText

export const homeNavigationItems = [
  { label: navigation.home, href: '/' },
  { label: navigation.rent, href: '/imoveis?finalidade=alugar' },
  { label: navigation.buy, href: '/imoveis?finalidade=comprar' },
  { label: navigation.brokers, href: '/corretores' },
  { label: navigation.agencies, href: '/imobiliarias' },
] as const

export const footerColumns: FooterColumn[] = [
  {
    title: footer.columns.forYou,
    links: [
      { label: footer.links.searchProperties, href: '/imoveis' },
      { label: footer.links.favorites, href: '/imoveis' },
      { label: footer.links.financialSimulator, href: '/imoveis' },
    ],
  },
  {
    title: footer.columns.brokers,
    links: [
      { label: footer.links.listProperty, href: '/login' },
      { label: footer.links.partnerPortal, href: '/login' },
      { label: footer.links.corporateSolutions, href: '/imoveis' },
    ],
  },
  {
    title: footer.columns.company,
    links: [
      { label: footer.links.aboutUs, href: '/' },
      { label: footer.links.contact, href: '/' },
      { label: footer.links.workWithUs, href: '/' },
    ],
  },
]

export const legalLinks = [
  { label: footer.links.termsOfUse, href: '/' },
  { label: footer.links.privacyPolicy, href: '/' },
] as const
