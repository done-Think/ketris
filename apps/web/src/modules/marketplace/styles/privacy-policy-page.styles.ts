import type { SxProps, Theme } from '@mui/material'
import { surface } from '@shared/theme/tokens'

export const styles = {
  page: {
    width: '100%',
    maxWidth: '100vw',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    overflowX: 'clip',
    bgcolor: surface.app,
  },
  main: { py: { xs: 2.4, md: 4 } },
  article: {
    display: 'flex',
    flexDirection: 'column',
    gap: { xs: 3, md: 4 },
    maxWidth: 760,
  },
  header: { display: 'flex', flexDirection: 'column', gap: 1 },
  section: { display: 'flex', flexDirection: 'column', gap: 1.5 },
  list: { m: 0, pl: 3, display: 'flex', flexDirection: 'column', gap: 1 },
  // Long addresses must wrap on phones instead of widening the page.
  breakable: { overflowWrap: 'anywhere' },
} satisfies Record<string, SxProps<Theme>>
