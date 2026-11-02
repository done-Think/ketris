'use client'

import VideocamOffOutlinedIcon from '@mui/icons-material/VideocamOffOutlined'
import { Box, Button, CircularProgress, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import type { CameraFallbackProps } from '../../types/capture.types'
import { liveCaptureStyles as styles } from '../../styles/capture.styles'
import { GalleryButton } from './GalleryButton'
import { ContinueOnPhoneButton } from './ContinueOnPhoneButton'
import { useCaptureDevice } from '../../hooks/use-capture-device'

export function CameraFallback({
  token,
  status,
  allowGallery,
  galleryInFooter = false,
  onFile,
  onAlternative,
  onRetry,
  disabled,
}: CameraFallbackProps) {
  const t = useTranslations('face_check.capture.live')
  const device = useCaptureDevice()

  if (status === 'starting') {
    return (
      <Box sx={styles.notice}>
        <CircularProgress size={28} color="inherit" aria-label={t('starting')} />
        <Typography sx={styles.noticeText}>{t('starting')}</Typography>
        <Typography sx={styles.noticeText}>{t('permissionHint')}</Typography>
        <ContinueOnPhoneButton token={token} dark disabled={disabled} />
      </Box>
    )
  }

  return (
    <Box sx={styles.notice}>
      <VideocamOffOutlinedIcon sx={styles.noticeIcon} />
      <Typography sx={styles.noticeTitle}>
        {t(
          status === 'denied'
            ? 'deniedTitle'
            : status === 'notFound'
              ? 'notFoundTitle'
              : status === 'insecure'
                ? 'insecureTitle'
                : status === 'unsupported'
                  ? 'unsupportedTitle'
                  : 'unavailableTitle',
        )}
      </Typography>
      <Typography sx={styles.noticeText}>
        {t(
          status === 'denied'
            ? 'deniedHint'
            : status === 'notFound'
              ? 'notFoundHint'
              : status === 'insecure'
                ? 'insecureHint'
                : status === 'unsupported'
                  ? 'unsupportedHint'
                  : 'unavailableHint',
          { device },
        )}
      </Typography>
      <ContinueOnPhoneButton token={token} dark disabled={disabled} />
      {status !== 'insecure' && status !== 'unsupported' ? (
        <Button sx={styles.galleryButton} onClick={onRetry} disabled={disabled}>
          {t('retryCamera')}
        </Button>
      ) : null}
      {allowGallery ? (
        galleryInFooter ? null : (
          <GalleryButton label={t('chooseFile')} onFile={onFile} disabled={disabled} />
        )
      ) : (
        <Button variant="outlined" sx={styles.galleryButton} onClick={onAlternative}>
          {t('withoutCamera')}
        </Button>
      )}
    </Box>
  )
}
