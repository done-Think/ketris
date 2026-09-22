'use client'

import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined'
import { zodResolver } from '@hookform/resolvers/zod'
import { Box, Button, Link as MuiLink, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useForm, useWatch } from 'react-hook-form'

import { brand, componentText, radius } from '@shared/theme/tokens'

import { authPrimaryButtonSx } from './auth-form.styles'
import { VerificationCodeField } from './VerificationCodeField'
import { verificationCodeSchema } from '../schemas/password-recovery-schema'

export interface EmailVerificationStepProps {
  email: string
  onConfirmed: () => void
}

export function EmailVerificationStep({ email, onConfirmed }: EmailVerificationStepProps) {
  const t = useTranslations('auth.registerDetails.emailVerification')
  const { control, handleSubmit } = useForm({
    resolver: zodResolver(verificationCodeSchema),
    defaultValues: { code: '' },
  })
  const code = useWatch({ control, name: 'code' })
  const isCodeComplete = /^\d{6}$/.test(code ?? '')

  const confirm = handleSubmit(() => {
    onConfirmed()
  })

  return (
    <Box sx={{ textAlign: 'center', mt: 4 }}>
      <Box
        aria-hidden="true"
        sx={{
          width: 52,
          height: 52,
          mx: 'auto',
          display: 'grid',
          placeItems: 'center',
          borderRadius: `${radius.full}px`,
          bgcolor: brand.magenta[50],
        }}
      >
        <MarkEmailReadOutlinedIcon sx={{ color: 'primary.main', fontSize: 28 }} />
      </Box>

      <Typography variant="h5" sx={{ mt: 2, mb: 0.5 }}>
        {t('title')}
      </Typography>
      <Typography color="text.secondary" sx={{ maxWidth: 420, mx: 'auto' }}>
        {t('description', { email })}
      </Typography>

      <Box component="form" noValidate onSubmit={confirm} sx={{ mt: 3, maxWidth: 280, mx: 'auto' }}>
        <Stack spacing={2}>
          <VerificationCodeField control={control} name="code" label={t('code.label')} />

          <Button
            type="submit"
            variant="contained"
            disabled={!isCodeComplete}
            sx={authPrimaryButtonSx}
          >
            {t('submit')}
          </Button>

          <MuiLink
            component="button"
            type="button"
            onClick={onConfirmed}
            underline="hover"
            sx={{ color: 'text.secondary', ...componentText.authCompactBody }}
          >
            {t('skip')}
          </MuiLink>
        </Stack>
      </Box>
    </Box>
  )
}
