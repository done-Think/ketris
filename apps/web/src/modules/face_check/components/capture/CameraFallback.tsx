'use client'

import VideocamOffOutlinedIcon from '@mui/icons-material/VideocamOffOutlined'
import { Box, Button, CircularProgress, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import type { CameraFallbackProps } from '../../types/capture.types'
import { liveCaptureStyles as styles } from '../../styles/capture.styles'
import { GalleryButton } from './GalleryButton'

export function CameraFallback({
  status,
  allowGallery,
  galleryInFooter = false,
  onFile,
  onAlternative,
  disabled,
}: CameraFallbackProps) {
  const t = useTranslations('face_check.capture.live')

  if (status === 'starting') {
    return (
      <Box sx={styles.notice}>
        <CircularProgress size={28} color="inherit" aria-label={t('starting')} />
        <Typography sx={styles.noticeText}>{t('starting')}</Typography>
      </Box>
    )
  }

  return (
    <Box sx={styles.notice}>
      <VideocamOffOutlinedIcon sx={styles.noticeIcon} />
      <Typography sx={styles.noticeTitle}>
        {status === 'denied' ? t('deniedTitle') : t('unavailableTitle')}
      </Typography>
      <Typography sx={styles.noticeText}>
        {allowGallery ? t('galleryHint') : t('noGalleryHint')}
      </Typography>
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
