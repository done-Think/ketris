import type { SxProps, Theme } from '@mui/material'
import { componentText, iconSize, radius, shadows, surface } from '@shared/theme/tokens'

export const styles = {
  box: {
    alignSelf: 'start',
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: `${radius.sm}px`,
    bgcolor: surface.paper,
    boxShadow: shadows.propertyCard,
    p: 2,
  },
  typography: { ...componentText.cardTitle, mb: 0.8 },
  typography2: { color: 'text.secondary', fontSize: 13, fontWeight: 500, mb: 1.5 },
  box2: {
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: `${radius.sm}px`,
    bgcolor: surface.app,
    px: 1.2,
    py: 1,
    mb: 1.5,
  },
  typography3: { fontSize: 12, fontWeight: 500, wordBreak: 'break-word' },
  box3: { display: 'block', textDecoration: 'none' },
  linkOutlinedIcon: { fontSize: iconSize.sm },
  divider: { mb: 2 },
  divider2: { my: 2 },
  typography4: { color: 'text.secondary', fontSize: 11, fontWeight: 500 },
  typography5: { fontSize: 13, fontWeight: 700 },
} satisfies Record<string, SxProps<Theme>>

export function getButtonStyles({
  accentColor,
  hoverColor,
}: {
  accentColor: string
  hoverColor: string
}): SxProps<Theme> {
  return {
    mb: 2,
    borderColor: accentColor,
    color: accentColor,
    '&:hover': {
      borderColor: accentColor,
      bgcolor: hoverColor,
    },
  }
}

export function getButtonStyles2({ accentColor }: { accentColor: string }): SxProps<Theme> {
  return {
    bgcolor: accentColor,
    '&:hover': {
      bgcolor: accentColor,
      filter: 'brightness(0.92)',
    },
  }
}
