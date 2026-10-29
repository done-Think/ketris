import type { SxProps, Theme } from '@mui/material'
import { alpha, brand, radius, surface } from '@shared/theme/tokens'

export const stackSx: SxProps<Theme> = { mt: 1.4 }

export const boxSx: SxProps<Theme> = {
  position: 'absolute',
  inset: 'auto 0 0',
  px: 0.8,
  py: 0.35,
  bgcolor: alpha.black[60],
  color: surface.lightText,
  fontSize: 10,
}

export const typographySx: SxProps<Theme> = { mt: 1.4, color: brand.neutral[400], fontSize: 12 }

export function getBoxSx(
  attachment: import('../types/service').ApiMaintenanceAttachment,
): SxProps<Theme> {
  return {
    position: 'relative',
    width: { xs: '50%', sm: 160 },
    height: 105,
    borderRadius: `${radius.sm}px`,
    overflow: 'hidden',
    backgroundImage: `url(${attachment.url})`,
    backgroundPosition: 'center',
    backgroundSize: 'cover',
  }
}
