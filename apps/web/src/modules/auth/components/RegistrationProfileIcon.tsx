import { Box } from '@mui/material'

import { brand, radius } from '@shared/theme/tokens'

import type { RegistrationProfile } from '../config/registration-profiles'

type RegistrationProfileIconProps = {
  variant: RegistrationProfile['icon']
}

export function RegistrationProfileIcon({ variant }: RegistrationProfileIconProps) {
  return (
    <Box
      aria-hidden="true"
      sx={{
        width: 48,
        height: 48,
        display: 'grid',
        placeItems: 'center',
        borderRadius: `${radius.full}px`,
        bgcolor: brand.magenta[50],
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: variant === 'briefcase' ? 20 : 18,
          height: variant === 'briefcase' ? 16 : 18,
          borderRadius:
            variant === 'circle' ? `${radius.full}px` : variant === 'square' ? '3px' : '2px',
          bgcolor: brand.magenta[500],
          ...(variant === 'briefcase' && {
            mt: 0.5,
            '&::before': {
              content: '""',
              position: 'absolute',
              top: -5,
              left: 6,
              width: 8,
              height: 6,
              border: `3px solid ${brand.magenta[500]}`,
              borderBottom: 0,
              borderRadius: '3px 3px 0 0',
            },
          }),
        }}
      />
    </Box>
  )
}
