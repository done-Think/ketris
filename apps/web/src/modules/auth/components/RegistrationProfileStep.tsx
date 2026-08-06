'use client'

import { useState } from 'react'
import { Box, Button, RadioGroup, Typography } from '@mui/material'

import { authPrimaryButtonSx } from './auth-form.styles'
import { RegistrationProfileCard } from './RegistrationProfileCard'
import { registrationFontFamily } from './registration.styles'
import {
  DEFAULT_REGISTRATION_PROFILE,
  REGISTRATION_PROFILES,
  type RegistrationProfileId,
} from '../config/registration-profiles'

type RegistrationProfileStepProps = {
  isAdvancing: boolean
  onContinue: (profile: RegistrationProfileId) => void
}

export function RegistrationProfileStep({ isAdvancing, onContinue }: RegistrationProfileStepProps) {
  const [selectedProfile, setSelectedProfile] = useState<RegistrationProfileId>(
    DEFAULT_REGISTRATION_PROFILE,
  )

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mt: { xs: 4, sm: 5 }, textAlign: 'center' }}>
        <Typography component="h1" variant="h2" sx={{ fontFamily: registrationFontFamily.heading }}>
          Qual é o seu perfil?
        </Typography>
        <Typography
          color="text.secondary"
          sx={{ mt: 0.75, fontFamily: registrationFontFamily.body }}
        >
          Escolha como você vai usar o Ketris
        </Typography>
      </Box>

      <RadioGroup
        aria-label="Perfil"
        name="registration-profile"
        value={selectedProfile}
        onChange={(event) => setSelectedProfile(event.target.value as RegistrationProfileId)}
        sx={{
          mt: { xs: 4, sm: 5.5 },
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 2,
        }}
      >
        {REGISTRATION_PROFILES.map((profile) => (
          <RegistrationProfileCard
            key={profile.id}
            profile={profile}
            selected={selectedProfile === profile.id}
          />
        ))}
      </RadioGroup>

      <Button
        type="button"
        variant="contained"
        aria-busy={isAdvancing}
        disabled={isAdvancing}
        onClick={() => onContinue(selectedProfile)}
        sx={{
          ...authPrimaryButtonSx,
          width: '100%',
          maxWidth: 334,
          mt: { xs: 5, md: 'auto' },
          mx: 'auto',
          fontFamily: registrationFontFamily.body,
        }}
      >
        Continuar
      </Button>
    </Box>
  )
}
