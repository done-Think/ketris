'use client'

import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded'
import { Alert, Box, IconButton, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { BrandMark, StepProgress } from '../ui'

import type { CaptureLayoutProps, ProgressStepName } from '../../types/capture.types'
import { captureLayoutStyles } from '../../styles/capture.styles'

const progressOrder: ProgressStepName[] = ['consent', 'document', 'selfie', 'submit']

export function CaptureLayout({
  children,
  footer,
  tone = 'light',
  progressStep,
  onBack,
}: CaptureLayoutProps) {
  const t = useTranslations('face_check.capture')
  const styles = captureLayoutStyles(tone)
  const current = progressStep ? progressOrder.indexOf(progressStep) + 1 : 0

  return (
    <Box sx={styles.page} data-face-check-private="true" className="sentry-block">
      <Box sx={styles.column}>
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
        <Box component="main" sx={styles.main}>
          {children}
        </Box>
        {footer ? <Box sx={styles.footer}>{footer}</Box> : null}
      </Box>
    </Box>
  )
}
