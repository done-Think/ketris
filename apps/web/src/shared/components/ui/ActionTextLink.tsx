import { Link as MuiLink } from '@mui/material'
import type { ReactNode } from 'react'
import Link from 'next/link'

import { componentText } from '@shared/theme/tokens'

type ActionTextLinkProps = {
  href: string
  children: ReactNode
}

export function ActionTextLink({ href, children }: ActionTextLinkProps) {
  return (
    <MuiLink
      component={Link}
      href={href}
      underline="none"
      sx={{
        color: 'primary.main',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        ...componentText.sectionAction,
      }}
    >
      {children}
    </MuiLink>
  )
}
