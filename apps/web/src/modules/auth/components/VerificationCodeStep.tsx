'use client'

import { useEffect } from 'react'
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined'
import { Box, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useWatch, type Control } from 'react-hook-form'

import { brand, componentText, radius } from '@shared/theme/tokens'

import { ResendCountdownButton } from './ResendCountdownButton'
import { VerificationCodeField } from './VerificationCodeField'
import type { PasswordResetFormValues } from '../schemas/password-recovery-schema'

export interface VerificationCodeStepProps {
  control: Control<PasswordResetFormValues>
  onCodeComplete: () => void
  onResend: () => void
}

export function VerificationCodeStep({
  control,
  onCodeComplete,
  onResend,
}: VerificationCodeStepProps) {
  const t = useTranslations('auth.passwordRecovery')
  const code = useWatch({ control, name: 'code' })

  useEffect(() => {
    if (/^\d{6}$/.test(code ?? '')) {
      onCodeComplete()
    }
  }, [code, onCodeComplete])

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
          <MarkEmailReadOutlinedIcon sx={{ color: 'primary.main', fontSize: { xs: 18, md: 28 } }} />
        </Box>
      </Box>

      <Box sx={{ mt: { xs: 2, md: 4 }, textAlign: 'center' }}>
        <Typography variant="h3" sx={componentText.authCompactTitle}>
          {t('code.title')}
        </Typography>
        <Typography
          color="text.secondary"
          variant="body2"
          sx={{ mt: 0.5, ...componentText.authCompactBody }}
        >
          {t('code.description')}
        </Typography>
      </Box>

      <Stack spacing={1.5} sx={{ mt: { xs: 2, md: 3 } }}>
        <VerificationCodeField control={control} name="code" label={t('code.label')} />
        <ResendCountdownButton onResend={onResend} />
      </Stack>
    </Box>
  )
}
