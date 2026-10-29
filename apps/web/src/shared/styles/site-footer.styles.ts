import { alpha, componentText, iconSize, surface } from '@shared/theme/tokens'

export const styles = {
  box: { mt: 'auto', bgcolor: surface.dark, color: surface.lightText },
  box2: {
    display: 'grid',
    gridTemplateColumns: {
      xs: '1fr',
      md: 'minmax(260px, 1fr) minmax(520px, 0.95fr)',
    },
    gap: { xs: 1.25, md: 7 },
    py: { xs: 2.4, md: 7 },
  },
  box3: { textAlign: { xs: 'center', md: 'left' } },
  typography: {
    color: alpha.white[62],
    ...componentText.footerBody,
    maxWidth: { xs: 310, md: 360 },
    mx: { xs: 'auto', md: 0 },
  },
  stack: { mt: { xs: 0.8, md: 3 } },
  iconButton: {
    width: 32,
    height: 32,
    bgcolor: alpha.white[8],
    color: alpha.white[78],
    '&:hover': {
      bgcolor: 'primary.main',
      color: surface.lightText,
    },
  },
  icon: { fontSize: iconSize.md },
  box4: {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(120px, 1fr))' },
    gap: { xs: 1.25, md: 6 },
    justifySelf: { md: 'end' },
    width: '100%',
    maxWidth: { md: 620 },
  },
  box5: { textAlign: { xs: 'center', md: 'right' } },
  typography2: { ...componentText.footerHeading, mb: { xs: 0.5, md: 2 } },
  muiLink: {
    color: alpha.white[56],
    ...componentText.footerLink,
    whiteSpace: 'nowrap',
    '&:hover': { color: surface.lightText },
  },
  divider: {
    borderColor: alpha.white[8],
    width: '100vw',
    ml: 'calc(50% - 50vw)',
  },
  stack2: { py: { xs: 2, md: 3 }, textAlign: { xs: 'center', sm: 'left' } },
  typography3: { color: alpha.white[50], ...componentText.footerLegal },
  muiLink2: {
    ...componentText.footerBrand,
    color: 'inherit',
    '&:hover': { color: surface.lightText },
  },
  muiLink3: { color: alpha.white[50], ...componentText.footerLegal },
} as const
