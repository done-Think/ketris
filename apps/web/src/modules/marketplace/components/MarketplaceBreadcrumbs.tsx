'use client'

import { Stack, Typography } from '@mui/material'

import { Link } from '@/i18n/navigation'
import type { MarketplaceBreadcrumbsProps } from '../types/breadcrumb'
import { styles } from '../styles/marketplace-breadcrumbs.styles'

export function MarketplaceBreadcrumbs({ items }: MarketplaceBreadcrumbsProps) {
  return (
    <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap" sx={styles.stack}>
      {items.map((item, index) => {
        const isCurrent = index === items.length - 1

        return (
          <Stack key={`${item.href ?? 'current'}-${item.label}`} direction="row" spacing={0.8}>
            {index > 0 ? <Typography sx={styles.typography}>/</Typography> : null}
            {item.href && !isCurrent ? (
              <Typography component={Link} href={item.href} sx={styles.typography2}>
                {item.label}
              </Typography>
            ) : (
              <Typography aria-current="page" title={item.label} sx={styles.typography3}>
                {item.label}
              </Typography>
            )}
          </Stack>
        )
      })}
    </Stack>
  )
}
