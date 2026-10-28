import { alpha, brand, iconSize, surface } from '@shared/theme/tokens'

export const styles = {
  iconButton: {
    position: 'absolute',
    right: -14,
    top: 32,
    zIndex: 1,
    width: 28,
    height: 28,
    bgcolor: brand.graphite[600],
    border: '1px solid',
    borderColor: alpha.white[8],
    color: alpha.white[62],
    '&:hover': { bgcolor: brand.graphite[600], color: surface.lightText },
  },
  keyboardDoubleArrowLeftRoundedIcon: (collapsed: boolean) =>
    ({
      fontSize: iconSize.sm,
      transform: collapsed ? 'rotate(180deg)' : 'none',
      transition: 'transform 180ms ease',
    }) as const,
} as const
