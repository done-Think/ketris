import type { SxProps, Theme } from '@mui/material'
import { alpha, brand, dashboardLayout, iconSize, radius, surface } from '@shared/theme/tokens'

export const stackSx: SxProps<Theme> = {
  width: '100%',
  alignItems: { xs: 'stretch', sm: 'center' },
  [dashboardLayout.desktopMediaQuery]: { width: 'auto' },
}

export const textFieldSx: SxProps<Theme> = {
  width: { xs: '100%', sm: 268 },
  '& .MuiInputBase-root': {
    height: { xs: 40, sm: 32 },
    borderRadius: `${radius.sm}px`,
    bgcolor: surface.paper,
    color: brand.graphite[500],
    fontSize: 12,
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: alpha.graphite[8],
  },
}

export const searchRoundedIconSx: SxProps<Theme> = {
  color: brand.neutral[400],
  fontSize: iconSize.sm,
}

export const addRoundedIconSx: SxProps<Theme> = { fontSize: iconSize.sm }

export const dashboardHeaderActionButtonSx: SxProps<Theme> = {
  '&.Mui-disabled': {
    bgcolor: brand.magenta[500],
    color: surface.lightText,
    opacity: 1,
  },
}

export const boxSx: SxProps<Theme> = {
  display: { xs: 'none' },
  [dashboardLayout.desktopMediaQuery]: { display: 'block' },
}

export const dashboardPageHeaderSx: SxProps<Theme> = { mb: 2.2 }
