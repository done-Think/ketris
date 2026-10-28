import { alpha, componentText, radius, surface } from '@shared/theme/tokens'

export const styles = {
  box: {
    minHeight: 26,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    bgcolor: surface.paper,
    border: '1px solid',
    borderColor: alpha.graphite[8],
    borderRadius: radius.full,
    boxShadow: `0 4px 12px ${alpha.graphite[16]}`,
    color: 'text.primary',
    fontFamily: 'inherit',
    px: 1.15,
    py: 0,
    textAlign: 'center',
    whiteSpace: 'nowrap',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
    textRendering: 'optimizeLegibility',
    ...componentText.cardTitle,
    fontSize: 13,
    lineHeight: 1.25,
  },
} as const
