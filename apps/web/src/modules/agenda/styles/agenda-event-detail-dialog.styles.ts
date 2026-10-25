import type { SxProps, Theme } from '@mui/material'
import { alpha, brand, iconSize, radius, surface } from '@shared/theme/tokens'

export const styles = {
  dialogTitle: { px: { xs: 2, md: 2.8 }, pb: 1.4, pt: 2.4 } satisfies SxProps<Theme>,
  box: { minWidth: 0 } satisfies SxProps<Theme>,
  typography: { color: brand.magenta[600], fontSize: 13, fontWeight: 900 } satisfies SxProps<Theme>,
  typography2: {
    color: brand.graphite[500],
    fontSize: 22,
    fontWeight: 900,
  } satisfies SxProps<Theme>,
  closeRoundedIcon: { fontSize: iconSize.lg } satisfies SxProps<Theme>,
  dialogContent: { px: { xs: 2, md: 2.8 }, pb: 2 } satisfies SxProps<Theme>,
  box2: {
    border: '1px solid',
    borderColor: alpha.graphite[8],
    borderRadius: `${radius.sm}px`,
    bgcolor: surface.app,
    p: 1.6,
  } satisfies SxProps<Theme>,
  homeWorkOutlinedIcon: {
    color: brand.magenta[500],
    fontSize: iconSize.md,
  } satisfies SxProps<Theme>,
  muiLink: { color: brand.graphite[500], fontSize: 15, fontWeight: 900 } satisfies SxProps<Theme>,
  typography3: {
    color: brand.neutral[500],
    fontSize: 15,
    fontWeight: 700,
  } satisfies SxProps<Theme>,
  phoneOutlinedIcon: { color: brand.neutral[500], fontSize: iconSize.md } satisfies SxProps<Theme>,
  typography4: {
    color: brand.graphite[500],
    fontSize: 14,
    fontWeight: 800,
  } satisfies SxProps<Theme>,
  typography5: {
    color: brand.graphite[500],
    fontSize: 14,
    fontWeight: 800,
  } satisfies SxProps<Theme>,
  typography6: {
    color: brand.graphite[500],
    fontSize: 14,
    fontWeight: 800,
  } satisfies SxProps<Theme>,
  typography7: {
    color: brand.neutral[500],
    fontSize: 12,
    fontWeight: 700,
  } satisfies SxProps<Theme>,
  typography8: {
    color: brand.graphite[500],
    fontSize: 14,
    fontWeight: 900,
    mb: 0.8,
  } satisfies SxProps<Theme>,
  typography9: {
    color: brand.neutral[500],
    fontSize: 14,
    lineHeight: 1.65,
  } satisfies SxProps<Theme>,
  dialogActions: { px: { xs: 2, md: 2.8 }, pb: 2.5, pt: 0 } satisfies SxProps<Theme>,
  deleteOutlineRoundedIcon: { fontSize: iconSize.sm } satisfies SxProps<Theme>,
  editRoundedIcon: { fontSize: iconSize.sm } satisfies SxProps<Theme>,
}
