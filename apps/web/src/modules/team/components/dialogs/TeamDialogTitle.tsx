'use client'

import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { DialogTitle, IconButton, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { styles } from '../../styles/team-dialog.styles'
import type { TeamDialogTitleProps } from '../../types/broker-team'

export function TeamDialogTitle({ title, onClose }: TeamDialogTitleProps) {
  const t = useTranslations('dashboard.team')

  return (
    <DialogTitle sx={styles.title}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
        <Typography component="span" sx={styles.titleText}>
          {title}
        </Typography>
        <IconButton aria-label={t('dialogs.close')} onClick={onClose}>
          <CloseRoundedIcon />
        </IconButton>
      </Stack>
    </DialogTitle>
  )
}
