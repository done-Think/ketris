'use client'

import { Button } from '@mui/material'

import { brand, componentText, radius } from '@shared/theme/tokens'

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
}: ResendCountdownButtonProps) {
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
      disabled={isCountingDown}
      aria-live="polite"
      onClick={resend}
      sx={{
        height: { xs: 30, md: 46 },
        borderRadius: `${radius.sm}px`,
        borderColor: brand.neutral[100],
        ...componentText.authCompactBody,
        '&.Mui-disabled': {
          borderColor: brand.neutral[100],
          color: 'text.secondary',
        },
      }}
    >
      {isCountingDown ? `Reenviar em ${formatCountdown(remainingSeconds)}` : 'Reenviar e-mail'}
    </Button>
  )
}
