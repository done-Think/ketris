'use client'

import { styles } from '../styles/resend-countdown-button.styles'

import { Button } from '@mui/material'
import { useTranslations } from 'next-intl'

import { useResendCountdown } from '../hooks/use-resend-countdown'
import type { ResendCountdownButtonProps } from '../types/password-recovery'

const RESEND_DELAY_SECONDS = 60

function formatCountdown(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function ResendCountdownButton({
  onResend,
  seconds = RESEND_DELAY_SECONDS,
  disabled = false,
}: ResendCountdownButtonProps) {
  const t = useTranslations('auth.passwordRecovery')
  const { remainingSeconds, isCountingDown, restart } = useResendCountdown(seconds)

  function resend() {
    restart()
    onResend()
  }

  return (
    <Button
      type="button"
      variant="outlined"
      color="secondary"
      fullWidth
      disabled={isCountingDown || disabled}
      aria-live="polite"
      onClick={resend}
      sx={styles.button}
    >
      {isCountingDown
        ? t('resendCountdown', { time: formatCountdown(remainingSeconds) })
        : t('resend')}
    </Button>
  )
}
