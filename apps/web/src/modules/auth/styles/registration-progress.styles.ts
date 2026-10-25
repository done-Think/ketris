import type { SxProps, Theme } from '@mui/material'
import { brand, motion, radius } from '@shared/theme/tokens'

export function getStyles(isCurrentStep: boolean) {
  return {
    box: {
      width: isCurrentStep ? 32 : 8,
      height: 8,
      borderRadius: `${radius.full}px`,
      bgcolor: isCurrentStep ? brand.magenta[500] : brand.neutral[100],
      transition: motion.transition.progressStep,
      '@media (prefers-reduced-motion: reduce)': {
        transition: 'none',
      },
    },
  } satisfies Record<string, SxProps<Theme>>
}
