import type { SxProps, Theme } from '@mui/material'
import { iconSize } from '@shared/theme/tokens'

export const styles = {
  section: { mt: 3, mb: 4 },
  title: { fontWeight: 600, mb: 2 },
  list: {
    m: 0,
    p: 0,
    listStyle: 'none',
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 1,
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    minWidth: 0,
    overflowWrap: 'anywhere',
  },
  icon: { color: 'primary.main', fontSize: iconSize.lg, flexShrink: 0 },
  observationSection: { mt: 3 },
  observation: { whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' },
} satisfies Record<string, SxProps<Theme>>
