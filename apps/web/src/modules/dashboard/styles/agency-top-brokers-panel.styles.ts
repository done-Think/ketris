import type { SxProps, Theme } from '@mui/material'
import { alpha, brand, motion, radius, rankingMedal } from '@shared/theme/tokens'

export const styles = {
  box: { minWidth: 0, p: { xs: 2, md: 2.4 } },
  typography: { color: brand.graphite[500], fontSize: 15, fontWeight: 900 },
  typography2: { mb: 1.4, color: brand.neutral[500], fontSize: 11.5, fontWeight: 700 },
  avatar: { width: 28, height: 28, fontSize: 10 },
  box2: { minWidth: 0, flex: 1 },
  typography3: { color: brand.graphite[500], fontSize: 12, fontWeight: 900 },
  typography4: { color: brand.neutral[500], fontSize: 10 },
} satisfies Record<string, SxProps<Theme>>

const rankColors = [rankingMedal.gold, brand.neutral[200], rankingMedal.bronze]

export function getBrokerButtonStyles(highlighted: boolean): SxProps<Theme> {
  return {
    display: 'block',
    width: '100%',
    borderRadius: `${radius.sm}px`,
    textAlign: 'left',
    transition: motion.transition.interactive,
    '&:hover': { bgcolor: highlighted ? alpha.magenta[10] : alpha.graphite[6] },
    '&.Mui-focusVisible': { boxShadow: `0 0 0 2px ${alpha.magenta[14]}` },
  }
}

export function getBrokerRowStyles(highlighted: boolean): SxProps<Theme> {
  return {
    minHeight: 42,
    borderRadius: `${radius.sm}px`,
    bgcolor: highlighted ? alpha.magenta[6] : 'transparent',
    px: 1,
  }
}

export function getRankStyles(index: number): SxProps<Theme> {
  return {
    display: 'grid',
    width: 20,
    height: 20,
    placeItems: 'center',
    borderRadius: '50%',
    bgcolor: rankColors[index] ?? rankingMedal.bronze,
    color: brand.graphite[500],
    fontSize: 10,
    fontWeight: 900,
  }
}

export function getRevenueStyles(highlighted: boolean): SxProps<Theme> {
  return {
    color: highlighted ? brand.magenta[600] : brand.graphite[500],
    fontSize: 12,
    fontWeight: 900,
  }
}
