import { alpha as muiAlpha } from '@mui/material/styles'

import { brand, radius, surface } from '@shared/theme/tokens'

export const authTextFieldSx = {
  '& .MuiOutlinedInput-root': {
    height: 46,
    borderRadius: `${radius.sm}px`,
    bgcolor: surface.paper,
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: brand.neutral[100],
  },
  '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: brand.neutral[300],
  },
  '& .MuiInputBase-input': {
    px: 1.75,
    py: 1.5,
    '&::placeholder': {
      color: brand.neutral[500],
      opacity: 1,
    },
    '&:-webkit-autofill': {
      WebkitBoxShadow: `0 0 0 100px ${surface.paper} inset`,
      WebkitTextFillColor: brand.graphite[500],
      caretColor: brand.graphite[500],
    },
  },
  '& .MuiFormHelperText-root': {
    mx: 0,
    mt: 0.75,
  },
} as const

export const authPrimaryButtonSx = {
  height: 50,
  borderRadius: `${radius.sm}px`,
  boxShadow: `0 8px 18px ${muiAlpha(brand.magenta[500], 0.2)}`,
} as const
