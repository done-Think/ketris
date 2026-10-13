'use client'

import { useEffect } from 'react'
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined'
import { Alert, Box, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useWatch } from 'react-hook-form'

import { brand, componentText, radius } from '@shared/theme/tokens'

import { ResendCountdownButton } from './ResendCountdownButton'
import { VerificationCodeField } from './VerificationCodeField'
import type { VerificationCodeStepProps } from '../types/password-recovery'

export function VerificationCodeStep({
  control,
  isVerifying,
  error,
  onCodeComplete,
  onResend,
}: VerificationCodeStepProps) {
  const t = useTranslations('auth.passwordRecovery')
  const code = useWatch({ control, name: 'code' })

  useEffect(() => {
    if (!isVerifying && /^\d{6}$/.test(code ?? '')) {
      onCodeComplete()
    }
  }, [code, isVerifying, onCodeComplete])

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
        {error ? <Alert severity="error">{error}</Alert> : null}
        <VerificationCodeField
          control={control}
          name="code"
          label={t('code.label')}
          disabled={isVerifying}
        />
        <ResendCountdownButton onResend={onResend} disabled={isVerifying} />
      </Stack>
    </Box>
  )
}
