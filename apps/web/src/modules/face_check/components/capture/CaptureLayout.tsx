'use client'

import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded'
import { Alert, Box, IconButton, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { BrandMark, StepProgress } from '../ui'

import type { CaptureLayoutProps, ProgressStepName } from '../../types/capture.types'
import { captureLayoutStyles } from '../../styles/capture.styles'
import { useCapturePresentation } from '../../stores/CapturePresentationProvider'

const progressOrder: ProgressStepName[] = ['consent', 'document', 'selfie', 'submit']

export function CaptureLayout({
  children,
  footer,
  tone = 'light',
  progressStep,
  onBack,
}: CaptureLayoutProps) {
  const t = useTranslations('face_check.capture')
  const variant = useCapturePresentation()
  const isDashboard = variant === 'dashboard'
  const styles = captureLayoutStyles(tone, variant)
  const current = progressStep ? progressOrder.indexOf(progressStep) + 1 : 0

  return (
    <Box
      component={isDashboard ? 'section' : 'div'}
      aria-label={isDashboard ? t('dashboardTitle') : undefined}
      sx={styles.page}
      data-capture-presentation={variant}
      data-face-check-private="true"
      className="sentry-block"
    >
      <Box sx={styles.column}>
        {isDashboard ? (
          <Box sx={styles.dashboardHeading}>
            {onBack ? (
              <IconButton aria-label={t('header.back')} onClick={onBack} sx={styles.backButton}>
                <ArrowBackIosNewRoundedIcon fontSize="small" />
              </IconButton>
            ) : null}
            <Typography component="p" sx={styles.dashboardTitle}>
              {t('dashboardTitle')}
            </Typography>
          </Box>
        ) : (
          <Box component="header" sx={styles.header}>
            {onBack ? (
              <IconButton aria-label={t('header.back')} onClick={onBack} sx={styles.backButton}>
                <ArrowBackIosNewRoundedIcon fontSize="small" />
              </IconButton>
            ) : (
              <span />
            )}
            <Box sx={styles.brand}>
              <BrandMark size="sm" />
              <Typography component="span" sx={styles.brandName}>
                {t('header.brand')}
              </Typography>
            </Box>
            <span />
          </Box>
        )}
        <Alert severity="info">{t('cameraNotice')}</Alert>
        {progressStep ? (
          <StepProgress
            tone={tone}
            current={current}
            total={progressOrder.length}
            label={t('progress.label', {
              current,
              total: progressOrder.length,
              name: t(`progress.names.${progressStep}`),
            })}
          />
        ) : null}
        <Box component={isDashboard ? 'div' : 'main'} sx={styles.main}>
          {children}
        </Box>
        {footer ? <Box sx={styles.footer}>{footer}</Box> : null}
      </Box>
    </Box>
  )
}
