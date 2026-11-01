import CenterFocusWeakRoundedIcon from '@mui/icons-material/CenterFocusWeakRounded'
import { Box } from '@mui/material'

import type { BrandMarkProps } from '../../types'

import { brandMarkStyles } from '../../styles/shared-ui.styles'

export function BrandMark({ size = 'md' }: BrandMarkProps) {
  return (
    <Box sx={brandMarkStyles.root(size)} aria-hidden>
      <CenterFocusWeakRoundedIcon sx={brandMarkStyles.icon(size)} />
    </Box>
  )
}
