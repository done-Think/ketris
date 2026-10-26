import type { SxProps, Theme } from '@mui/material'

import { surface } from '@shared/theme/tokens'
const pipelineBodyFontFamily = 'var(--font-inter), system-ui, -apple-system, sans-serif'
export function getBoxSx(viewMode: string): SxProps<Theme> {
  return {
    minHeight: '100vh',
    ...(viewMode === 'kanban'
      ? {
          height: { md: '100vh' },
          display: { md: 'flex' },
          flexDirection: { md: 'column' },
        }
      : {}),
    p: 3.5,
    bgcolor: surface.app,
    overflow: 'hidden',
    fontFamily: pipelineBodyFontFamily,
    '& .MuiTypography-root, & .MuiButton-root, & .MuiInputBase-root': {
      fontFamily: pipelineBodyFontFamily,
    },
    '& h1.MuiTypography-root': {
      fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif',
    },
  }
}
