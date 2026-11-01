import { Box, Typography } from '@mui/material'

import type { PageHeaderProps } from '../../types'

import { pageHeaderStyles } from '../../styles/shared-ui.styles'

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <Box component="header" sx={pageHeaderStyles.root}>
      <Box sx={pageHeaderStyles.titleBlock}>
        <Typography component="h1" sx={pageHeaderStyles.title}>
          {title}
        </Typography>
        {subtitle ? <Typography sx={pageHeaderStyles.subtitle}>{subtitle}</Typography> : null}
      </Box>
      {actions ? <Box sx={pageHeaderStyles.actions}>{actions}</Box> : null}
    </Box>
  )
}
