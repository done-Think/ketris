import type { SxProps, Theme } from '@mui/material'
import { brand, iconSize, radius } from '@shared/theme/tokens'
import type { AgendaEventToneStyle } from '../types/agenda-event'

export const styles = {
  box: (tone: AgendaEventToneStyle): SxProps<Theme> => ({
    border: '1px solid',
    borderColor: tone.borderColor,
    borderRadius: `${radius.sm}px`,
    bgcolor: tone.bgcolor,
    p: 1.6,
  }),
  title: (tone: AgendaEventToneStyle): SxProps<Theme> => ({
    color: tone.color,
    fontSize: 15,
    fontWeight: 900,
  }),
  icon: (tone: AgendaEventToneStyle): SxProps<Theme> => ({
    color: tone.color,
    fontSize: iconSize.xl,
  }),
  meta: {
    color: brand.neutral[600],
    fontSize: 12,
    fontWeight: 700,
    mt: 0.4,
    mb: 1.2,
  } satisfies SxProps<Theme>,
  details: {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
    columnGap: 2,
    rowGap: 0.8,
    m: 0,
  } satisfies SxProps<Theme>,
  label: { color: brand.neutral[500], fontSize: 14, fontWeight: 700 } satisfies SxProps<Theme>,
  value: {
    color: brand.graphite[500],
    fontSize: 14,
    fontWeight: 800,
    m: 0,
    whiteSpace: 'pre-line',
    overflowWrap: 'anywhere',
  } satisfies SxProps<Theme>,
}
