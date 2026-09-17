import { useTranslations } from 'next-intl'

import type { MarketplaceBreadcrumbItem } from '../types/breadcrumb'
import type { PropertyBreadcrumbPurpose, PropertyBreadcrumbsProps } from '../types/property-detail'
import { MarketplaceBreadcrumbs } from './MarketplaceBreadcrumbs'

function buildLocationHref(location: string) {
  return { pathname: '/properties', query: { location } } as const
}

function buildPurposeHref(purpose: PropertyBreadcrumbPurpose) {
  return {
    pathname: '/properties',
    query: { purpose: purpose === 'comprar' ? 'buy' : 'rent' },
  } as const
}

export function PropertyBreadcrumbs({
  context,
  location,
  propertyTitle,
}: PropertyBreadcrumbsProps) {
  const t = useTranslations('marketplace')
  const [neighborhood = location, city = 'São Paulo'] = location
    .split(',')
    .map((item) => item.trim())

  const locationBreadcrumbs: MarketplaceBreadcrumbItem[] = [
    { label: t('navigation.home'), href: '/' },
    { label: city, href: buildLocationHref(city) },
    { label: neighborhood, href: buildLocationHref(neighborhood) },
  ]

  if (context?.originType === 'broker' && context.originName && context.originHref) {
    return (
      <MarketplaceBreadcrumbs
        items={[
          { label: t('navigation.home'), href: '/' },
          { label: t('navigation.brokers'), href: '/brokers' },
          { label: context.originName, href: context.originHref },
          { label: propertyTitle },
        ]}
      />
    )
  }

  if (context?.originType === 'agency' && context.originName && context.originHref) {
    return (
      <MarketplaceBreadcrumbs
        items={[
          { label: t('navigation.home'), href: '/' },
          { label: t('navigation.agencies'), href: '/agencies' },
          { label: context.originName, href: context.originHref },
          { label: propertyTitle },
        ]}
      />
    )
  }

  if (context?.purpose === 'alugar' || context?.purpose === 'comprar') {
    return (
      <MarketplaceBreadcrumbs
        items={[
          { label: t('navigation.home'), href: '/' },
          {
            label: context.purpose === 'comprar' ? t('navigation.buy') : t('navigation.rent'),
            href: buildPurposeHref(context.purpose),
          },
          { label: propertyTitle },
        ]}
      />
    )
  }

  return <MarketplaceBreadcrumbs items={[...locationBreadcrumbs, { label: propertyTitle }]} />
}
