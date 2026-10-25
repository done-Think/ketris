'use client'

import { styles } from '../styles/verification-code-step.styles'

import { useEffect } from 'react'
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined'
import { Alert, Box, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useWatch } from 'react-hook-form'

import { componentText } from '@shared/theme/tokens'

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
      <Box sx={styles.box}>
        <Box aria-hidden="true" sx={styles.box2}>
          <MarkEmailReadOutlinedIcon sx={styles.markEmailReadOutlinedIcon} />
        </Box>
      </Box>

      <Box sx={styles.box3}>
        <Typography variant="h3" sx={componentText.authCompactTitle}>
          {t('code.title')}
        </Typography>
        <Typography color="text.secondary" variant="body2" sx={styles.typography}>
          {t('code.description')}
        </Typography>
      </Box>

      <Stack spacing={1.5} sx={styles.stack}>
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
