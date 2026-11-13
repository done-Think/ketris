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

export const contractAmountFieldSx = {
  mb: { xs: 1.8, md: 2.2, xl: 2.6 },
  '& .MuiInputBase-root.MuiInputBase-adornedStart': {
    pl: 1.4,
  },
  '& .MuiInputAdornment-root': {
    mr: 0.5,
  },
  '& .MuiInputAdornment-root .MuiTypography-root': {
    fontSize: 'inherit',
    lineHeight: 'inherit',
    color: 'text.primary',
  },
  '& .MuiInputBase-input': {
    pl: 0,
  },
} as const

export const contractMultilineFieldSx = {
  gridColumn: '1 / -1',
  '& .MuiInputBase-root.MuiInputBase-multiline': {
    alignItems: 'flex-start',
    px: 1.4,
    py: 1.15,
  },
  '& .MuiInputBase-input': {
    p: 0,
  },
} as const
