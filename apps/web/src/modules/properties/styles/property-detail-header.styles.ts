import type { PropertyStatusStyle } from '../types/dashboard-property'
import { radius, surface } from '@shared/theme/tokens'
import type { SxProps, Theme } from '@mui/material'

export const styles = {
  stack: { mb: 2.6 },
  box: { flex: '1 1 420px', minWidth: 0 },
  stack2: { mb: 0.7 },
  typography: {
    minWidth: 0,
    fontSize: { xs: 30, md: 42 },
    fontWeight: 900,
    overflowWrap: 'anywhere',
  },
  typography2: { color: 'text.secondary', fontSize: { xs: 15, md: 17 } },
  stack3: { flexShrink: 0, maxWidth: '100%' },
  button: {
    height: 46,
    px: 2.2,
    borderRadius: `${radius.sm}px`,
    bgcolor: surface.paper,
    fontSize: 15,
    fontWeight: 900,
  },
  button2: {
    height: 46,
    px: 2.2,
    borderRadius: `${radius.sm}px`,
    bgcolor: surface.paper,
    fontSize: 15,
    fontWeight: 900,
  },
  button3: {
    height: 46,
    px: 2.4,
    borderRadius: `${radius.sm}px`,
    fontSize: 15,
    fontWeight: 900,
  },
  button4: {
    height: 46,
    px: 2.4,
    borderRadius: `${radius.sm}px`,
    bgcolor: surface.paper,
    fontSize: 15,
    fontWeight: 900,
  },
} satisfies Record<string, SxProps<Theme>>

export function getStatusChipStyles(status: PropertyStatusStyle): SxProps<Theme> {
  return {
    flexShrink: 0,
    height: 32,
    borderRadius: `${radius.full}px`,
    bgcolor: status.bgcolor,
    color: status.color,
    fontSize: 13.5,
    fontWeight: 900,
  }
}
