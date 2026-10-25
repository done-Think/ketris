'use client'

import { styles, newPasswordTextFieldSx } from '../styles/new-password-step.styles'

import { useState } from 'react'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import { Box, Button, IconButton, InputAdornment, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { RhfTextField } from '@shared/components/form'
import { componentText } from '@shared/theme/tokens'

import { AuthFormField } from '@shared/components/form/AuthFormField'
import type { NewPasswordStepProps, PasswordFieldName } from '../types/password-recovery'

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
            sx={styles.iconButton}
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
      <Box sx={styles.box}>
        <Box aria-hidden="true" sx={styles.box2}>
          <LockOutlinedIcon sx={styles.lockOutlinedIcon} />
        </Box>
      </Box>

      <Box sx={styles.box3}>
        <Typography variant="h3" sx={componentText.authCompactTitle}>
          {t('newPasswordStep.title')}
        </Typography>
        <Typography color="text.secondary" variant="body2" sx={styles.typography}>
          {t('newPasswordStep.description')}
        </Typography>
      </Box>

      <Box component="form" noValidate onSubmit={onSubmit} sx={styles.box4}>
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

        <Box sx={styles.box5}>
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
          sx={styles.button}
        >
          {t('resetSubmit')}
        </Button>
      </Box>
    </Box>
  )
}
