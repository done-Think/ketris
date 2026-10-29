import type { SxProps, Theme } from '@mui/material'
import { surface } from '@shared/theme/tokens'
import { alpha } from '@shared/theme/tokens'
import { brand, iconSize, radius } from '@shared/theme/tokens'

export const styles = {
  typography: { fontSize: 12, fontWeight: 700, color: 'text.secondary' },
  avatar: { width: 58, height: 58, flex: '0 0 auto' },
  box: {
    width: 104,
    height: 58,
    objectFit: 'cover',
    borderRadius: `${radius.sm}px`,
    flex: '0 0 auto',
  },
  cloudUploadOutlinedIcon: { color: brand.neutral[500], fontSize: iconSize.md },
  typography2: { color: brand.neutral[500], fontSize: 12, fontWeight: 800 },
  closeRoundedIcon: { fontSize: iconSize.sm },
} satisfies Record<string, SxProps<Theme>>

export function getBoxStyles({
  error,
  isDragActive,
  disabled,
}: {
  error: string | undefined
  isDragActive: boolean
  disabled: boolean
}): SxProps<Theme> {
  return {
    flex: 1,
    minHeight: 58,
    border: '1px dashed',
    borderColor: error ? 'error.main' : isDragActive ? 'primary.main' : 'divider',
    borderRadius: `${radius.sm}px`,
    bgcolor: isDragActive ? alpha.magenta[6] : surface.app,
    display: 'grid',
    placeItems: 'center',
    px: 1.4,
    py: 1,
    textAlign: 'center',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
  }
}

export function getTypographyStyles({ error }: { error: string | undefined }): SxProps<Theme> {
  return { fontSize: 11, color: error ? 'error.main' : 'text.secondary' }
}
