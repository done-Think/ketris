import type { SxProps, Theme } from '@mui/material'

export const boxSx: SxProps<Theme> = { mb: 2 }

export const typographySx: SxProps<Theme> = { mb: 1 }

export const boxSx2: SxProps<Theme> = {
  display: 'grid',
  gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'minmax(0, 344px) auto' },
  gridTemplateAreas: {
    xs: '"date" "notice" "save"',
    sm: '"date save" "notice notice"',
  },
  gap: 1.5,
  alignItems: 'start',
}

export const boxSx3: SxProps<Theme> = {
  gridArea: 'date',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 1.5,
  '& input, & select': { textAlign: 'center' },
  '& input::-webkit-datetime-edit': { textAlign: 'center' },
  '& .MuiInputLabel-shrink': {
    left: '50%',
    transform: 'translate(-50%, -9px) scale(0.75)',
    transformOrigin: 'top center',
  },
  '& .MuiOutlinedInput-notchedOutline legend': { marginInline: 'auto' },
}

export const rhfTextFieldSx: SxProps<Theme> = { width: 160, maxWidth: '100%' }

export const rhfTextFieldSx2: SxProps<Theme> = { width: 85 }

export const rhfTextFieldSx3: SxProps<Theme> = { width: 75 }

export const alertSx: SxProps<Theme> = { gridArea: 'notice' }

export const buttonSx: SxProps<Theme> = {
  gridArea: 'save',
  justifySelf: 'start',
  alignSelf: 'center',
}
