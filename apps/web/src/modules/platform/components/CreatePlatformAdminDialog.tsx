'use client'

import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from '@mui/material'
import { useTranslations } from 'next-intl'

import { CreatePlatformAdminForm } from './CreatePlatformAdminForm'
import type { CreatePlatformAdminDialogProps } from '../types/platform-admin'
import { styles } from '../styles/create-platform-admin-dialog.styles'

export function CreatePlatformAdminDialog({ open, onClose }: CreatePlatformAdminDialogProps) {
  const t = useTranslations('platform.admins')

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={styles.dialogTitle}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
          <Box sx={styles.box}>
            <Typography sx={styles.typography}>{t('createTitle')}</Typography>
            <Typography sx={styles.typography2}>{t('createDescription')}</Typography>
          </Box>
          <IconButton aria-label={t('closeCreateDialog')} onClick={onClose}>
            <CloseRoundedIcon sx={styles.closeRoundedIcon} />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent sx={styles.dialogContent}>
        <CreatePlatformAdminForm onCancel={onClose} onSuccess={onClose} />
      </DialogContent>
    </Dialog>
  )
}
