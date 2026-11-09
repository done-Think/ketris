import { alpha, iconSize, radius, surface, brand } from '@shared/theme/tokens'
import type { SxProps, Theme } from '@mui/material'

export const styles = {
  cloudUploadOutlinedIcon: { color: brand.neutral[500], fontSize: iconSize.xl },
  typography: { color: brand.neutral[500], fontWeight: 900 },
  rejectTypography: { color: 'error.main', fontWeight: 900 },
  hint: { color: brand.neutral[500], fontSize: 13 },
  rejectHint: { color: 'error.main', fontSize: 13 },
  box: {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, minmax(0, 1fr))' },
    gap: 1.6,
  },
  box2: { position: 'relative' },
  box3: {
    display: 'block',
    width: '100%',
    aspectRatio: '1 / 1',
    objectFit: 'cover',
    borderRadius: `${radius.sm}px`,
  },
  iconButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    bgcolor: alpha.black[60],
    color: surface.lightText,
    '&:hover': { bgcolor: alpha.black[80] },
  },
  closeRoundedIcon: { fontSize: iconSize.sm },
} satisfies Record<string, SxProps<Theme>>

export function getDropzoneStyles(isDragActive: boolean, isDragReject = false): SxProps<Theme> {
  return {
    minHeight: 150,
    border: '1px dashed',
    borderColor: isDragReject ? 'error.main' : isDragActive ? 'primary.main' : 'divider',
    borderRadius: `${radius.sm}px`,
    bgcolor: isDragReject ? alpha.error[6] : isDragActive ? alpha.magenta[6] : surface.paper,
    display: 'grid',
    placeItems: 'center',
    px: 2,
    textAlign: 'center',
    cursor: 'pointer',
  }
}
