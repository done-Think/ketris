import { brand, radius, surface } from '@shared/theme/tokens'

export const contractTextFieldSx = {
  '& .MuiInputLabel-root': {
    color: brand.graphite[500],
    fontSize: 12,
    fontWeight: 900,
    transform: 'none',
    position: 'static',
    mb: 0.6,
  },
  '& .MuiInputBase-root': {
    borderRadius: `${radius.sm}px`,
    bgcolor: surface.paper,
    fontSize: 13,
    minHeight: 42,
  },
  '& .MuiInputBase-input': {
    px: 1.4,
    py: 1.15,
  },
  '& .MuiSelect-select': {
    px: 1.4,
    py: 1.15,
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: brand.neutral[200],
  },
  '& legend': { display: 'none' },
  '& fieldset': { top: 0 },
} as const
