import type { SxProps, Theme } from '@mui/material'

import { alpha, componentText } from '@shared/theme/tokens'

export const styles = {
  list: {
    mt: { sm: 3.2, xl: 5 },
    display: { xs: 'none', sm: 'flex' },
    width: '100%',
    maxWidth: { sm: 620, xl: 760 },
    transform: { sm: 'translateY(20px)', lg: 'none' },
  },
  value: { color: 'primary.main', ...componentText.heroStatValue },
  label: { color: alpha.white[78], ...componentText.heroStatLabel },
} satisfies Record<string, SxProps<Theme>>
