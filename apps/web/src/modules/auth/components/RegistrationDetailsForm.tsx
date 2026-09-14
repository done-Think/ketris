'use client'

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormHelperText,
  IconButton,
  InputAdornment,
  Typography,
} from '@mui/material'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import { useTranslations } from 'next-intl'
import { Controller, useForm } from 'react-hook-form'

import { RhfMaskedTextField, RhfTextField } from '@shared/components/form'
import { brand } from '@shared/theme/tokens'

import { AuthFormField } from './AuthFormField'
import { authPrimaryButtonSx, authTextFieldSx } from './auth-form.styles'
import { registrationDetailsSchema } from '../schemas/registration-details-schema'
import type {
  RegistrationDetailsFormProps,
  RegistrationDetailsFormValues,
  RegistrationPasswordField,
  RegistrationPasswordFieldName,
} from '../types/registration'

const PHONE_MASK = [{ mask: '(00) 0000-0000' }, { mask: '(00) 00000-0000' }]

const passwordFields: ReadonlyArray<RegistrationPasswordField> = [
  { name: 'password', translationKey: 'password' },
  { name: 'passwordConfirmation', translationKey: 'passwordConfirmation' },
]

export function RegistrationDetailsForm({ profile, onSubmit }: RegistrationDetailsFormProps) {
  const t = useTranslations('auth.registerDetails')
  const [visiblePasswordField, setVisiblePasswordField] =
    useState<RegistrationPasswordFieldName | null>(null)
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<RegistrationDetailsFormValues>({
    resolver: zodResolver(registrationDetailsSchema),
    defaultValues: {
      profile,
      fullName: '',
      email: '',
      phone: '',
      password: '',
      passwordConfirmation: '',
      creci: '',
      acceptTerms: false,
    },
  })

  function submitDetails(values: RegistrationDetailsFormValues) {
    onSubmit?.(values)
  }

  function togglePasswordVisibility(fieldName: RegistrationPasswordFieldName) {
    setVisiblePasswordField((current) => (current === fieldName ? null : fieldName))
  }

  return (
    <Box component="form" noValidate onSubmit={handleSubmit(submitDetails)} sx={{ mt: 4 }}>
      <Box sx={{ display: 'grid', gap: 2.25 }}>
        <AuthFormField htmlFor="registration-full-name" label={t('fullName.label')} required>
          <RhfTextField
            id="registration-full-name"
            control={control}
            name="fullName"
            placeholder={t('fullName.placeholder')}
            autoComplete="name"
            fullWidth
            sx={authTextFieldSx}
          />
        </AuthFormField>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'minmax(0, 1.35fr) minmax(0, 0.85fr)' },
            gap: 2,
          }}
        >
          <AuthFormField htmlFor="registration-email" label={t('email.label')} required>
            <RhfTextField
              id="registration-email"
              control={control}
              name="email"
              placeholder={t('email.placeholder')}
              type="email"
              autoComplete="email"
              fullWidth
              sx={authTextFieldSx}
            />
          </AuthFormField>

          <AuthFormField htmlFor="registration-phone" label={t('phone.label')} required>
            <RhfMaskedTextField
              id="registration-phone"
              control={control}
              name="phone"
              mask={PHONE_MASK}
              placeholder={t('phone.placeholder')}
              type="tel"
              autoComplete="tel"
              fullWidth
              sx={authTextFieldSx}
            />
          </AuthFormField>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
            gap: 2,
          }}
        >
          {passwordFields.map((field) => {
            const isVisible = visiblePasswordField === field.name
            const label = t(`${field.translationKey}.label`)

            return (
              <AuthFormField
                key={field.name}
                htmlFor={`registration-${field.name}`}
                label={label}
                required
              >
                <RhfTextField
                  id={`registration-${field.name}`}
                  control={control}
                  name={field.name}
                  placeholder={t(`${field.translationKey}.placeholder`)}
                  type={isVisible ? 'text' : 'password'}
                  autoComplete="new-password"
                  fullWidth
                  sx={authTextFieldSx}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label={t(
                              isVisible ? 'passwordVisibility.hide' : 'passwordVisibility.show',
                              { field: label },
                            )}
                            edge="end"
                            size="small"
                            onClick={() => togglePasswordVisibility(field.name)}
                            sx={{ color: brand.neutral[500] }}
                          >
                            {isVisible ? (
                              <VisibilityOffOutlinedIcon fontSize="small" />
                            ) : (
                              <VisibilityOutlinedIcon fontSize="small" />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </AuthFormField>
            )
          })}
        </Box>

        <AuthFormField
          htmlFor="registration-creci"
          label={t('creci.label')}
          required={profile === 'corretor'}
        >
          <RhfTextField
            id="registration-creci"
            control={control}
            name="creci"
            placeholder={t('creci.placeholder')}
            helperText={
              profile === 'corretor' ? t('creci.requiredHelper') : t('creci.optionalHelper')
            }
            fullWidth
            sx={authTextFieldSx}
          />
        </AuthFormField>
      </Box>

      <Controller
        control={control}
        name="acceptTerms"
        render={({ field, fieldState }) => (
          <FormControl error={Boolean(fieldState.error)} sx={{ mt: 2.25 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={field.value}
                  inputRef={field.ref}
                  name={field.name}
                  onBlur={field.onBlur}
                  onChange={(_, checked) => field.onChange(checked)}
                  size="small"
                  sx={{ p: 0, mr: 1.25, color: brand.neutral[200] }}
                />
              }
              label={
                <Typography color="text.secondary" variant="body2">
                  {t('terms.prefix')}{' '}
                  <Box component="span" sx={{ color: 'primary.main' }}>
                    {t('terms.termsOfUse')}
                  </Box>{' '}
                  {t('terms.connector')}{' '}
                  <Box component="span" sx={{ color: 'primary.main' }}>
                    {t('terms.privacyPolicy')}
                  </Box>
                </Typography>
              }
              sx={{ m: 0, alignItems: 'center' }}
            />
            {fieldState.error && (
              <FormHelperText sx={{ ml: 0 }}>{fieldState.error.message}</FormHelperText>
            )}
          </FormControl>
        )}
      />

      <Button
        type="submit"
        variant="contained"
        disabled={isSubmitting}
        sx={{
          ...authPrimaryButtonSx,
          width: '100%',
          maxWidth: 286,
          mt: 3.25,
        }}
      >
        {t('submit')}
      </Button>
    </Box>
  )
}
