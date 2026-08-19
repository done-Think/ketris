'use client'

import { Stack, Typography } from '@mui/material'
import Link from 'next/link'

type BreadcrumbContext = {
  originHref?: string
  originName?: string
  originType?: string
  purpose?: string
}

type PropertyBreadcrumbsProps = {
  category: string
  context?: BreadcrumbContext
  location: string
  propertyTitle: string
}

function buildLocationHref(location: string) {
  const params = new URLSearchParams({ localizacao: location })

  return `/imoveis?${params.toString()}`
}

function buildPurposeHref(purpose: string) {
  const params = new URLSearchParams({ finalidade: purpose })

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
  category,
  context,
  location,
  propertyTitle,
}: PropertyBreadcrumbsProps) {
  const breadcrumbs = buildJourneyBreadcrumbItems({ context, location })

  return (
    <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap" sx={{ mb: 2 }}>
      {breadcrumbs.map((item, index) => (
        <Stack key={`${item.href}-${item.label}`} direction="row" spacing={0.8}>
          {index > 0 ? (
            <Typography sx={{ color: 'text.secondary', fontSize: 12, fontWeight: 700 }}>
              /
            </Typography>
          ) : null}
          <Typography
            component={Link}
            href={item.href}
            sx={{
              color: 'text.secondary',
              fontSize: 12,
              fontWeight: 700,
              textDecoration: 'none',
              '&:hover': {
                color: 'primary.main',
                textDecoration: 'underline',
              },
            }}
          >
            {item.label}
          </Typography>
        </Stack>
      ))}
      <Stack direction="row" spacing={0.8}>
        <Typography sx={{ color: 'text.secondary', fontSize: 12, fontWeight: 700 }}>/</Typography>
        <Typography title={category} sx={{ color: 'primary.main', fontSize: 12, fontWeight: 700 }}>
          {propertyTitle}
        </Typography>
      </Stack>
    </Stack>
  )
}
