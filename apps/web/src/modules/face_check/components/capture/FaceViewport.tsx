'use client'

import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import { Box } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useEffect, useRef } from 'react'

import type { FaceViewportProps } from '../../types/capture.types'
import { faceRingColor, faceViewportStyles as styles } from '../../styles/viewports.styles'

export function FaceViewport({ ring, arrow, media, onGeometryChange }: FaceViewportProps) {
  const stage = useRef<HTMLDivElement>(null)
  const guide = useRef<HTMLDivElement>(null)
  const t = useTranslations('face_check.capture.live')
  const ringColor = faceRingColor[ring]
  const dashed = ring === 'active' ? '14 10' : undefined

  useEffect(() => {
    if (!onGeometryChange) return
    const measure = () => {
      const viewport = stage.current?.getBoundingClientRect()
      const oval = guide.current?.getBoundingClientRect()
      if (!viewport?.width || !viewport.height || !oval?.width || !oval.height) return
      onGeometryChange({
        width: viewport.width,
        height: viewport.height,
        guide: {
          x: oval.left - viewport.left,
          y: oval.top - viewport.top,
          width: oval.width,
          height: oval.height,
        },
      })
    }
    measure()
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
    if (stage.current) observer?.observe(stage.current)
    if (guide.current) observer?.observe(guide.current)
    window.addEventListener('resize', measure)
    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', measure)
      onGeometryChange(null)
    }
  }, [onGeometryChange])

  return (
    <Box ref={stage} sx={styles.stage} role="img" aria-label={t('selfiePreview')}>
      {media}
      <Box ref={guide} data-face-guide sx={styles.mask} />
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
