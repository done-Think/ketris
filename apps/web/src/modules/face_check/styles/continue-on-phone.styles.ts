import type { SxProps, Theme } from '@mui/material/styles'
import { brand } from './tokens'

export const continueOnPhoneStyles = {
  content: { display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 },
  qr: { alignSelf: 'center', bgcolor: 'common.white', p: 2, borderRadius: 2 },
  link: { '& input': { fontSize: 13 } },
  darkButton: { color: 'common.white', borderColor: brand.graphite[300], minHeight: 44 },
} satisfies Record<string, SxProps<Theme>>
