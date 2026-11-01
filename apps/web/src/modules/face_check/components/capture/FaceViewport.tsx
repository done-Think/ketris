'use client'

import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import { Box } from '@mui/material'
import { useTranslations } from 'next-intl'

import type { FaceViewportProps } from '../../types/capture.types'
import { faceRingColor, faceViewportStyles as styles } from '../../styles/viewports.styles'

export function FaceViewport({ ring, arrow, media }: FaceViewportProps) {
  const t = useTranslations('face_check.capture.live')
  const ringColor = faceRingColor[ring]
  const dashed = ring === 'active' ? '14 10' : undefined

  return (
    <Box sx={styles.stage} role="img" aria-label={t('selfiePreview')}>
      {media}
      <Box sx={styles.mask} />
      <Box component="svg" sx={styles.ring} width={252} height={328} viewBox="0 0 252 328">
        <ellipse
          cx="126"
          cy="164"
          rx="122"
          ry="160"
          fill="none"
          stroke={ringColor}
          strokeWidth={5}
          strokeDasharray={dashed}
        />
      </Box>
      {arrow === 'left' ? <ChevronLeftRoundedIcon sx={styles.arrow('left')} /> : null}
      {arrow === 'right' ? <ChevronRightRoundedIcon sx={styles.arrow('right')} /> : null}
    </Box>
  )
}
