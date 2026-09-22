'use client'

import { useState } from 'react'
import type { FormEventHandler } from 'react'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import { Box, Button, IconButton, InputAdornment, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import type { Control } from 'react-hook-form'

import { RhfTextField } from '@shared/components/form'
import { brand, componentText, radius } from '@shared/theme/tokens'

import { AuthFormField } from './AuthFormField'
import { authPrimaryButtonSx, authTextFieldSx } from './auth-form.styles'
import type { PasswordResetFormValues } from '../schemas/password-recovery-schema'

type PasswordFieldName = 'password' | 'passwordConfirmation'

const newPasswordTextFieldSx = {
  ...authTextFieldSx,
  '& .MuiOutlinedInput-root': {
    ...authTextFieldSx['& .MuiOutlinedInput-root'],
    height: { xs: 38, md: 46 },
  },
  '& .MuiInputBase-input': {
    ...authTextFieldSx['& .MuiInputBase-input'],
    py: { xs: 1, md: 1.5 },
  },
} as const

export interface NewPasswordStepProps {
  control: Control<PasswordResetFormValues>
  isSubmitting: boolean
  onSubmit: FormEventHandler<HTMLFormElement>
}

export function NewPasswordStep({ control, isSubmitting, onSubmit }: NewPasswordStepProps) {
  const t = useTranslations('auth.passwordRecovery')
  const [visibleFields, setVisibleFields] = useState<ReadonlySet<PasswordFieldName>>(new Set())

  function toggleVisibility(fieldName: PasswordFieldName) {
    setVisibleFields((current) => {
      const next = new Set(current)
      if (next.has(fieldName)) {
        next.delete(fieldName)
      } else {
        next.add(fieldName)
      }
      return next
    })
  }

  function visibilityAdornment(fieldName: PasswordFieldName, label: string) {
    const isVisible = visibleFields.has(fieldName)

    return {
      endAdornment: (
        <InputAdornment position="end">
          <IconButton
            aria-label={t(isVisible ? 'passwordVisibility.hide' : 'passwordVisibility.show', {
              field: label,
            })}
            edge="end"
            size="small"
            onClick={() => toggleVisibility(fieldName)}
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
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Box
          aria-hidden="true"
          sx={{
            width: { xs: 36, md: 60 },
            height: { xs: 36, md: 60 },
            display: { xs: 'none', md: 'grid' },
            placeItems: 'center',
            borderRadius: `${radius.full}px`,
            bgcolor: brand.magenta[50],
          }}
        >
          <LockOutlinedIcon sx={{ color: 'primary.main', fontSize: { xs: 18, md: 28 } }} />
        </Box>
      </Box>

      <Box sx={{ mt: { xs: 2, md: 4 }, textAlign: 'center' }}>
        <Typography variant="h3" sx={componentText.authCompactTitle}>
          {t('newPasswordStep.title')}
        </Typography>
        <Typography
          color="text.secondary"
          variant="body2"
          sx={{ mt: 0.5, ...componentText.authCompactBody }}
        >
          {t('newPasswordStep.description')}
        </Typography>
      </Box>

      <Box component="form" noValidate onSubmit={onSubmit} sx={{ mt: { xs: 1.5, md: 2.5 } }}>
        <AuthFormField htmlFor="password-reset-password" label={t('newPassword.label')}>
          <RhfTextField
            id="password-reset-password"
            control={control}
            name="password"
            type={visibleFields.has('password') ? 'text' : 'password'}
            placeholder={t('newPassword.placeholder')}
            autoComplete="new-password"
            fullWidth
            sx={newPasswordTextFieldSx}
            slotProps={{
              input: visibilityAdornment('password', t('newPassword.label')),
            }}
          />
        </AuthFormField>

        <Box sx={{ mt: 1.5 }}>
          <AuthFormField
            htmlFor="password-reset-confirmation"
            label={t('newPasswordConfirmation.label')}
          >
            <RhfTextField
              id="password-reset-confirmation"
              control={control}
              name="passwordConfirmation"
              type={visibleFields.has('passwordConfirmation') ? 'text' : 'password'}
              placeholder={t('newPasswordConfirmation.placeholder')}
              autoComplete="new-password"
              fullWidth
              sx={newPasswordTextFieldSx}
              slotProps={{
                input: visibilityAdornment(
                  'passwordConfirmation',
                  t('newPasswordConfirmation.label'),
                ),
              }}
            />
          </AuthFormField>
        </Box>

        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          disabled={isSubmitting}
          sx={{
            ...authPrimaryButtonSx,
            height: { xs: 30, md: 46 },
            mt: { xs: 2, md: 3.25 },
            ...componentText.authCompactBody,
          }}
        >
          {t('resetSubmit')}
        </Button>
      </Box>
    </Box>
  )
}
