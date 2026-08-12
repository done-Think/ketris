'use client'

import { Stack, Typography } from '@mui/material'
import Link from 'next/link'

type PropertyBreadcrumbsProps = {
  category: string
  location: string
}

function buildLocationHref(location: string) {
  const params = new URLSearchParams({ localizacao: location })

  return `/imoveis?${params.toString()}`
}

function buildBreadcrumbItems(location: string) {
  const [neighborhood = location, city = 'São Paulo'] = location
    .split(',')
    .map((item) => item.trim())

  return [
    { label: 'Home', href: '/' },
    { label: city, href: buildLocationHref(city) },
    { label: neighborhood, href: buildLocationHref(neighborhood) },
  ]
}

export function PropertyBreadcrumbs({ category, location }: PropertyBreadcrumbsProps) {
  const breadcrumbs = buildBreadcrumbItems(location)

  return (
    <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap" sx={{ mb: 2 }}>
      {breadcrumbs.map((item, index) => (
        <Stack key={item.label} direction="row" spacing={0.8}>
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
        <Typography sx={{ color: 'primary.main', fontSize: 12, fontWeight: 700 }}>
          {category}
        </Typography>
      </Stack>
    </Stack>
  )
}
