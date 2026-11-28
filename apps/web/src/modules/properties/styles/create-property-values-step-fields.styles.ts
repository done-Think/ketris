import type { SxProps, Theme } from '@mui/material'
import { iconSize } from '@shared/theme/tokens'

export const styles = {
  conditions: {
    gridColumn: '1 / -1',
    minWidth: 0,
    m: 0,
    p: 2,
    border: '1px solid',
    borderColor: 'divider',
  },
  conditionGroup: { mt: 1.5 },
  conditionHint: { mx: 0 },
  conditionOptions: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: { xs: 0.75, sm: 1.5 },
  },
  conditionOption: {
    m: 0,
    minWidth: 0,
    alignItems: 'flex-start',
    '& .MuiFormControlLabel-label': {
      overflowWrap: 'anywhere',
      fontSize: { xs: 12, sm: 14 },
      pt: { xs: 0.5, sm: 1 },
    },
  },
  conditionCheckbox: { p: { xs: 0.5, sm: 1 } },
  observation: { mt: 2 },
  helpButton: { color: 'text.secondary' },
  helpIcon: { fontSize: iconSize.lg },
  helpTooltip: { whiteSpace: 'pre-line', maxWidth: 340 },
  box: {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
    gap: 2,
  },
} satisfies Record<string, SxProps<Theme>>
