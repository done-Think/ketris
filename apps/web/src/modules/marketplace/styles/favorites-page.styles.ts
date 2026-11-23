import type { SxProps, Theme } from '@mui/material'

import { radius, shadows, surface } from '@shared/theme/tokens'

export const styles = {
  unavailableSection: { mt: 4 },
  unavailableHeading: { mb: 1.5 },
  unavailableCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
    p: 2,
    border: '1px dashed',
    borderColor: 'divider',
    borderRadius: `${radius.sm}px`,
    bgcolor: surface.paper,
  },
  unavailableLocation: { color: 'text.secondary', fontSize: 12, textTransform: 'uppercase' },
  unavailableTitle: { color: 'text.disabled', fontSize: 17, fontWeight: 500 },
  unavailableNote: {
    color: 'text.secondary',
    fontSize: 13,
    bgcolor: surface.app,
    borderRadius: `${radius.sm}px`,
    px: 1.5,
    py: 1,
  },
  unavailableAction: { alignSelf: 'flex-start' },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: 1.5,
    px: 3,
    py: { xs: 5, md: 7 },
    borderRadius: `${radius.lg}px`,
    bgcolor: surface.paper,
    boxShadow: shadows.crmListPanel,
  },
  emptyText: { color: 'text.secondary', maxWidth: 440 },
} satisfies Record<string, SxProps<Theme>>
