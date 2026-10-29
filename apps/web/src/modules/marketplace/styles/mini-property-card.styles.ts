import type { SxProps, Theme } from '@mui/material'

import { componentText, gradients, motion, radius, surface } from '@shared/theme/tokens'

export const styles = {
  card: {
    overflow: 'hidden',
    borderRadius: `${radius.sm}px`,
    border: '1px solid',
    borderColor: 'divider',
    bgcolor: surface.app,
    color: 'inherit',
    textDecoration: 'none',
    transition: motion.transition.tile,
    '&:hover': { borderColor: 'primary.main', transform: 'translateY(-2px)' },
  },
  body: { px: 1.2, py: 1 },
  title: {
    color: 'text.primary',
    ...componentText.miniCardTitle,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  location: {
    color: 'text.secondary',
    ...componentText.miniCardMeta,
    mt: 0.25,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
} satisfies Record<string, SxProps<Theme>>

export function getMiniPropertyImageStyles(image: string): SxProps<Theme> {
  return {
    height: { xs: 64, sm: 74 },
    backgroundImage: image ? gradients.miniPropertyImage(image) : 'none',
    bgcolor: surface.app,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }
}
