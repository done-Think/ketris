import type { PropertyBreadcrumbsProps } from '../types/property-detail'
import { MarketplaceBreadcrumbs } from './MarketplaceBreadcrumbs'

function buildLocationHref(location: string) {
  const params = new URLSearchParams({ location })

  return `/imoveis?${params.toString()}`
}

function buildPurposeHref(purpose: string) {
  const params = new URLSearchParams({ purpose })

  return `/imoveis?${params.toString()}`
}

function formatPurposeLabel(purpose: string) {
  return purpose === 'comprar' ? 'Comprar' : 'Alugar'
}

function buildLocationBreadcrumbItems(location: string) {
  const [neighborhood = location, city = 'São Paulo'] = location
    .split(',')
    .map((item) => item.trim())

  return [
    { label: 'Home', href: '/' },
    { label: city, href: buildLocationHref(city) },
    { label: neighborhood, href: buildLocationHref(neighborhood) },
  ]
}

function buildJourneyBreadcrumbItems({
  context,
  location,
}: Pick<PropertyBreadcrumbsProps, 'context' | 'location'>) {
  if (context?.originType === 'broker' && context.originName && context.originHref) {
    return [
      { label: 'Home', href: '/' },
      { label: 'Corretores', href: '/corretores' },
      { label: context.originName, href: context.originHref },
    ]
  }

  if (context?.originType === 'agency' && context.originName && context.originHref) {
    return [
      { label: 'Home', href: '/' },
      { label: 'Imobiliárias', href: '/imobiliarias' },
      { label: context.originName, href: context.originHref },
    ]
  }

  if (context?.purpose === 'alugar' || context?.purpose === 'comprar') {
    return [
      { label: 'Home', href: '/' },
      { label: formatPurposeLabel(context.purpose), href: buildPurposeHref(context.purpose) },
    ]
  }

  return buildLocationBreadcrumbItems(location)
}

export function PropertyBreadcrumbs({
  context,
  location,
  propertyTitle,
}: PropertyBreadcrumbsProps) {
  const breadcrumbs = buildJourneyBreadcrumbItems({ context, location })

  return <MarketplaceBreadcrumbs items={[...breadcrumbs, { label: propertyTitle }]} />
}
