import type { SxProps, Theme } from '@mui/material/styles'

export const myVerificationsStyles = {
  root: { p: { xs: 2, sm: 3.5 }, display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 },
  card: {
    p: { xs: 2, sm: 3 },
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: 3,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  heading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 1,
  },
  meta: { color: 'text.secondary' },
  action: { alignSelf: 'flex-start' },
} satisfies Record<string, SxProps<Theme>>
