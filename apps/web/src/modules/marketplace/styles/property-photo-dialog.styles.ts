import type { SxProps, Theme } from '@mui/material'
import { alpha, radius, surface } from '@shared/theme/tokens'

export const styles = {
  paper: {
    bgcolor: surface.darkDeep,
    color: surface.lightText,
  },
  box: {
    position: 'relative',
    display: 'grid',
    gridTemplateRows: 'auto minmax(0, 1fr) auto',
    height: '100vh',
    px: { xs: 1.5, md: 3 },
    py: { xs: 1.5, md: 2.5 },
  },
  typography: { fontSize: 13, fontWeight: 700 },
  iconButton: { color: surface.lightText },
  box2: {
    position: 'relative',
    display: 'grid',
    placeItems: 'center',
    minHeight: 0,
  },
  box3: {
    display: 'block',
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
    borderRadius: `${radius.sm}px`,
  },
  iconButton2: {
    position: 'absolute',
    left: { xs: 0, md: 12 },
    width: { xs: 42, md: 52 },
    height: { xs: 42, md: 52 },
    bgcolor: alpha.white[8],
    color: surface.lightText,
    '&:hover': {
      bgcolor: alpha.white[50],
    },
  },
  chevronLeftRoundedIcon: { fontSize: { xs: 30, md: 38 } },
  iconButton3: {
    position: 'absolute',
    right: { xs: 0, md: 12 },
    width: { xs: 42, md: 52 },
    height: { xs: 42, md: 52 },
    bgcolor: alpha.white[8],
    color: surface.lightText,
    '&:hover': {
      bgcolor: alpha.white[50],
    },
  },
  stack: {
    overflowX: 'auto',
    py: 1,
    px: { xs: 0, md: 6 },
  },
} satisfies Record<string, SxProps<Theme>>

export function getBoxStyles({
  index,
  activePhotoIndex,
  image,
}: {
  index: number
  activePhotoIndex: number
  image: string
}): SxProps<Theme> {
  return {
    flex: '0 0 auto',
    width: { xs: 72, md: 96 },
    height: { xs: 52, md: 68 },
    borderRadius: `${radius.sm}px`,
    border: '2px solid',
    borderColor: index === activePhotoIndex ? 'primary.main' : 'transparent',
    backgroundImage: `url("${image}")`,
    backgroundPosition: 'center',
    backgroundSize: 'cover',
    cursor: 'pointer',
    opacity: index === activePhotoIndex ? 1 : 0.62,
    p: 0,
  }
}
