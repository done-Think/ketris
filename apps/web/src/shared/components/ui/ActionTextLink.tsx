'use client'

import { styles } from '@shared/styles/action-text-link.styles'

import { Link as MuiLink } from '@mui/material'

import { Link } from '@/i18n/navigation'

import type { ActionTextLinkProps } from '@shared/types/action-text-link'

export function ActionTextLink({ href, children }: ActionTextLinkProps) {
  return (
    <MuiLink component={Link} href={href} underline="none" sx={styles.muiLink}>
      {children}
    </MuiLink>
  )
}
