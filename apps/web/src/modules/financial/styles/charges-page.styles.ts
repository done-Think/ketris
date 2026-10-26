import type { SxProps, Theme } from '@mui/material'
import { brand } from '@shared/theme/tokens'

export const styles = {
  page: { width: '100%', p: 3.5 },
  header: { pb: 1.75, borderBottom: '1px solid', borderColor: 'divider' },
  toolbar: { mt: '14px !important' },
  tabs: {
    minHeight: 36,
    alignSelf: { xs: 'stretch', md: 'flex-end' },
    '& .MuiTabs-flexContainer': { justifyContent: { xs: 'stretch', md: 'flex-end' } },
    '& .MuiTab-root': {
      minHeight: 36,
      px: { xs: 0, sm: 2 },
      flex: { xs: 1, md: 'initial' },
      whiteSpace: 'nowrap',
      textTransform: 'none',
      color: brand.neutral[500],
      fontSize: 12,
      fontWeight: 700,
    },
    '& .Mui-selected': { color: 'primary.main' },
    '& .MuiTabs-indicator': { height: 2 },
  },
} satisfies Record<string, SxProps<Theme>>
