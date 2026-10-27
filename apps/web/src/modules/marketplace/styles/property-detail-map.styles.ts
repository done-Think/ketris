import type { SxProps, Theme } from '@mui/material'
import { alpha, radius } from '@shared/theme/tokens'

export const styles = {
  box: {
    height: { xs: 240, md: 280 },
    overflow: 'hidden',
    borderRadius: `${radius.sm}px`,
    border: '1px solid',
    borderColor: 'divider',
  },
  box2: {
    width: 22,
    height: 22,
    borderRadius: '50%',
    bgcolor: 'primary.main',
    border: '4px solid',
    borderColor: 'common.white',
    boxShadow: `0 10px 24px ${alpha.magenta[36]}`,
  },
} satisfies Record<string, SxProps<Theme>>
