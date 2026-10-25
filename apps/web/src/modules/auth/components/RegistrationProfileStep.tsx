'use client'

import { styles } from '../styles/registration-profile-step.styles'

import { Box, Button, RadioGroup, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'

import { RegistrationProfileCard } from './RegistrationProfileCard'
import { registrationProfileSchema } from '../schemas/registration-profile-schema'
import {
  DEFAULT_REGISTRATION_PROFILE,
  REGISTRATION_PROFILES,
} from '../config/registration-profiles'
import type {
  RegistrationProfileFormValues,
  RegistrationProfileStepProps,
} from '../types/registration'

export function RegistrationProfileStep({ isAdvancing, onContinue }: RegistrationProfileStepProps) {
  const t = useTranslations('auth.register.profileStep')
  const profilesT = useTranslations('auth.register.profiles')
  const { control, handleSubmit } = useForm<RegistrationProfileFormValues>({
    resolver: zodResolver(registrationProfileSchema),
    defaultValues: { profile: DEFAULT_REGISTRATION_PROFILE },
  })

  return (
    <Box sx={styles.box}>
      <Box sx={styles.box2}>
        <Typography component="h1" variant="h2">
          {t('title')}
        </Typography>
        <Typography color="text.secondary" sx={styles.typography}>
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
            onChange={(event) => field.onChange(event.target.value)}
            sx={styles.radioGroup}
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
        onClick={handleSubmit(({ profile }) => onContinue(profile))}
        sx={styles.button}
      >
        {t('continue')}
      </Button>
    </Box>
  )
}
