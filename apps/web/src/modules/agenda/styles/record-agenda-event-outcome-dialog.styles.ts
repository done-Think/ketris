import type { SxProps, Theme } from '@mui/material'
import { alpha, brand, iconSize, radius, supportColor } from '@shared/theme/tokens'

const groupedOption = {
  m: 0,
  border: '1px solid',
  borderColor: alpha.graphite[8],
  textTransform: 'none',
  color: brand.neutral[600],
} as const

export const styles = {
  dialogTitle: { letterSpacing: 0, fontWeight: 900 } satisfies SxProps<Theme>,
  description: { color: brand.neutral[500], mb: 2 } satisfies SxProps<Theme>,
  label: {
    color: brand.graphite[500],
    fontSize: 13,
    fontWeight: 800,
    mb: 0.8,
  } satisfies SxProps<Theme>,
  section: { mb: 2 } satisfies SxProps<Theme>,
  outcomeGroup: {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
    gap: 1,
    '& .MuiToggleButtonGroup-grouped': {
      ...groupedOption,
      flexDirection: 'column',
      gap: 0.6,
      py: 1.4,
      fontWeight: 800,
      borderRadius: `${radius.sm}px`,
    },
    '& .MuiToggleButtonGroup-grouped .MuiSvgIcon-root': { fontSize: iconSize.xl },
    '& .MuiToggleButtonGroup-grouped.Mui-selected, & .MuiToggleButtonGroup-grouped.Mui-selected:hover':
      {
        bgcolor: supportColor.successSoft,
        borderColor: brand.semantic.success,
        color: brand.semantic.success,
      },
    '& .MuiToggleButtonGroup-grouped.Mui-selected[value="NO_SHOW"], & .MuiToggleButtonGroup-grouped.Mui-selected[value="NO_SHOW"]:hover':
      {
        bgcolor: brand.neutral[50],
        borderColor: brand.neutral[400],
        color: brand.neutral[700],
      },
  } satisfies SxProps<Theme>,
  interestGroup: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 1,
    '& .MuiToggleButtonGroup-grouped': {
      ...groupedOption,
      px: 2,
      py: 0.6,
      fontWeight: 700,
      borderRadius: `${radius.full}px`,
    },
    '& .MuiToggleButtonGroup-grouped.Mui-selected, & .MuiToggleButtonGroup-grouped.Mui-selected:hover':
      {
        bgcolor: alpha.magenta[10],
        borderColor: brand.magenta[500],
        color: brand.magenta[600],
      },
  } satisfies SxProps<Theme>,
  interestError: { mt: 0.6, mx: 0 } satisfies SxProps<Theme>,
}
