import { FormControlLabel, Radio, Stack, Typography } from '@mui/material'

import { alpha, brand, motion, radius, surface } from '@shared/theme/tokens'

import { RegistrationProfileIcon } from './RegistrationProfileIcon'
import { registrationFontFamily } from './registration.styles'
import type { RegistrationProfile } from '../config/registration-profiles'

type RegistrationProfileCardProps = {
  profile: RegistrationProfile
  selected: boolean
}

export function RegistrationProfileCard({ profile, selected }: RegistrationProfileCardProps) {
  return (
    <FormControlLabel
      value={profile.id}
      disableTypography
      control={
        <Radio
          disableRipple
          inputProps={{ 'aria-label': profile.title }}
          sx={{ position: 'absolute', width: 1, height: 1, p: 0, opacity: 0 }}
        />
      }
      label={
        <Stack alignItems="flex-start">
          <RegistrationProfileIcon variant={profile.icon} />

          <Typography
            variant="h6"
            sx={{ mt: 2, fontFamily: registrationFontFamily.body, fontWeight: 700 }}
          >
            {profile.title}
          </Typography>
          <Typography
            color="text.secondary"
            variant="body2"
            sx={{ mt: 0.5, fontFamily: registrationFontFamily.body }}
          >
            {profile.description}
          </Typography>
        </Stack>
      }
      sx={{
        width: { xs: '100%', sm: 'calc((100% - 16px) / 2)', md: 'calc((100% - 32px) / 3)' },
        minHeight: { xs: 164, md: 188 },
        m: 0,
        p: 3,
        position: 'relative',
        alignItems: 'flex-start',
        border: '1px solid',
        borderColor: selected ? brand.magenta[500] : brand.neutral[100],
        borderRadius: `${radius.md}px`,
        bgcolor: surface.paper,
        boxShadow: selected
          ? `0 12px 30px ${alpha.magenta[10]}`
          : `0 10px 28px ${alpha.graphite[8]}`,
        cursor: 'pointer',
        textAlign: 'left',
        transition: motion.transition.card,
        '&:hover': {
          borderColor: selected ? brand.magenta[500] : brand.neutral[300],
          transform: 'translateY(-2px)',
        },
        '&:has(.MuiRadio-root.Mui-focusVisible)': {
          outline: `3px solid ${alpha.magenta[14]}`,
          outlineOffset: 2,
        },
      }}
    />
  )
}
