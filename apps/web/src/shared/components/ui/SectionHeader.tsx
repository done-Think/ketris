import { Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'

import { componentText } from '@shared/theme/tokens'

type SectionHeaderProps = {
  title: string
  action?: ReactNode
}

export function SectionHeader({ title, action }: SectionHeaderProps) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      sx={{ mt: { xs: 0.5, md: '12px' }, mb: { xs: 2, md: 3 } }}
    >
      <Typography variant="overline" color="text.secondary" sx={componentText.sectionEyebrow}>
        {title}
      </Typography>
      {action}
    </Stack>
  )
}
