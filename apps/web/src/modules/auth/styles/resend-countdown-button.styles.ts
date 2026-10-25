import type { SxProps, Theme } from '@mui/material'
import { brand, componentText, radius } from '@shared/theme/tokens'

export const styles = {
  button: {
    height: { xs: 30, md: 46 },
    borderRadius: `${radius.sm}px`,
    borderColor: brand.neutral[100],
    ...componentText.authCompactBody,
    '&.Mui-disabled': {
      borderColor: brand.neutral[100],
      color: 'text.secondary',
    },
  },
} satisfies Record<string, SxProps<Theme>>
