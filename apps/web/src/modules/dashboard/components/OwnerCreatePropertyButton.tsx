'use client'

import { Button } from '@mui/material'
import { Link as NextLink } from '@/i18n/navigation'

import { radius } from '@shared/theme/tokens'

export function OwnerCreatePropertyButton() {
  return (
    <Button
      component={NextLink}
      href="/dashboard/properties/new"
      variant="contained"
      sx={{
        alignSelf: { xs: 'stretch', sm: 'center' },
        minHeight: 34,
        borderRadius: `${radius.sm}px`,
        px: 2.2,
        fontSize: 11.5,
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
    >
      Anunciar Novo Imóvel
    </Button>
  )
}
