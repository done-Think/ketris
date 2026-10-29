import type { SxProps, Theme } from '@mui/material'
import { brand, componentText, externalBrand, radius, surface } from '@shared/theme/tokens'

export function getStyles(hasError: boolean) {
  return {
    submitButton: { height: { xs: 36, md: 50 }, ...componentText.authBody },
    box: { mb: { xs: 2, md: 3.25 }, textAlign: { xs: 'center', md: 'left' } },
    typography: { mb: 0.5, ...componentText.authTitle },
    iconButton: { color: brand.neutral[500] },
    box2: { display: 'flex', justifyContent: 'flex-end', mt: { xs: 0.75, md: 1 } },
    typography2: {
      color: 'primary.main',
      ...componentText.authInlineLink,
      fontWeight: 700,
      textDecoration: 'none',
      '&:hover': { textDecoration: 'underline' },
    },
    alert: { mt: 0.75 },
    stack: { mt: hasError ? { xs: 2, md: 2.5 } : { xs: 2, md: 3.5 } },
    divider: {
      color: 'text.secondary',
      typography: 'caption',
      '&::before, &::after': { borderColor: brand.neutral[100] },
    },
    box3: {
      width: 20,
      height: 20,
      borderRadius: '50%',
      bgcolor: externalBrand.google,
      color: 'common.white',
      display: 'grid',
      placeItems: 'center',
      fontSize: 11,
      fontWeight: 700,
      lineHeight: 1,
    },
    button: {
      height: { xs: 36, md: 50 },
      borderRadius: `${radius.md}px`,
      bgcolor: surface.paper,
      borderColor: brand.neutral[100],
      ...componentText.authBody,
      '&.Mui-disabled': {
        borderColor: brand.neutral[100],
        color: 'text.primary',
      },
    },
    box4: { mt: { xs: 2.5, md: 3 }, display: 'flex', justifyContent: 'center' },
  } satisfies Record<string, SxProps<Theme>>
}
