'use client'

import { Box, Button, RadioGroup, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { Controller, useForm, useWatch } from 'react-hook-form'

import { authPrimaryButtonSx } from './auth-form.styles'
import { RegistrationProfileCard } from './RegistrationProfileCard'
import {
  DEFAULT_REGISTRATION_PROFILE,
  REGISTRATION_PROFILES,
} from '../config/registration-profiles'
import type {
  RegistrationProfileFormValues,
  RegistrationProfileId,
  RegistrationProfileStepProps,
} from '../types/registration'

export function RegistrationProfileStep({ isAdvancing, onContinue }: RegistrationProfileStepProps) {
  const t = useTranslations('auth.register.profileStep')
  const profilesT = useTranslations('auth.register.profiles')
  const { control } = useForm<RegistrationProfileFormValues>({
    defaultValues: { profile: DEFAULT_REGISTRATION_PROFILE },
  })
  const selectedProfile = useWatch({ control, name: 'profile' })

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mt: { xs: 4, sm: 5 }, textAlign: 'center' }}>
        <Typography component="h1" variant="h2">
          {t('title')}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.75 }}>
          {t('subtitle')}
        </Typography>
      </Box>

      <Controller
        control={control}
        name="profile"
        render={({ field }) => (
          <RadioGroup
            aria-label={t('ariaLabel')}
            name={field.name}
            value={field.value}
            onBlur={field.onBlur}
            onChange={(event) => field.onChange(event.target.value as RegistrationProfileId)}
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
                description={profilesT(`${profile.id}.description`)}
                profile={profile}
                selected={field.value === profile.id}
                title={profilesT(`${profile.id}.title`)}
              />
            ))}
          </RadioGroup>
        )}
      />

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
        }}
      >
        {t('continue')}
      </Button>
    </Box>
  )
}
