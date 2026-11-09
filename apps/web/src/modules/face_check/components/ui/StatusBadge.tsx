'use client'

import { Box } from '@mui/material'
import { useTranslations } from 'next-intl'

import type { StatusBadgeProps } from '../../types'
import { statusTone } from '../../utils/session-status'

import { statusBadgeSx } from '../../styles/shared-ui.styles'

export function StatusBadge({ status }: StatusBadgeProps) {
  const t = useTranslations('face_check.common.status')

  return (
    <Box component="span" sx={statusBadgeSx(statusTone[status])}>
      {t(status)}
    </Box>
  )
}
