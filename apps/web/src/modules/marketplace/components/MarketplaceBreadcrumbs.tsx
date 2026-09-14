'use client'

import { Stack, Typography } from '@mui/material'

import { Link } from '@/i18n/navigation'
import type { MarketplaceBreadcrumbsProps } from '../types/breadcrumb'

export function MarketplaceBreadcrumbs({ items }: MarketplaceBreadcrumbsProps) {
  return (
    <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap" sx={{ mb: 2 }}>
      {items.map((item, index) => {
        const isCurrent = index === items.length - 1

        return (
          <Stack key={`${item.href ?? 'current'}-${item.label}`} direction="row" spacing={0.8}>
            {index > 0 ? (
              <Typography sx={{ color: 'text.secondary', fontSize: 12, fontWeight: 700 }}>
                /
              </Typography>
            ) : null}
            {item.href && !isCurrent ? (
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
            ) : (
              <Typography
                aria-current="page"
                title={item.label}
                sx={{ color: 'primary.main', fontSize: 12, fontWeight: 700 }}
              >
                {item.label}
              </Typography>
            )}
          </Stack>
        )
      })}
    </Stack>
  )
}
