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

import { iconSize } from '@shared/theme/tokens'

import { CreatePlatformAdminForm } from './CreatePlatformAdminForm'

type CreatePlatformAdminDialogProps = {
  open: boolean
  onClose: () => void
}

export function CreatePlatformAdminDialog({ open, onClose }: CreatePlatformAdminDialogProps) {
  const t = useTranslations('platform.admins')

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ px: { xs: 2, md: 2.8 }, pb: 1.4, pt: 2.4 }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ color: 'text.primary', fontSize: 24, fontWeight: 900 }}>
              {t('createTitle')}
            </Typography>
            <Typography sx={{ color: 'text.secondary', fontSize: 13, mt: 0.5 }}>
              {t('createDescription')}
            </Typography>
          </Box>
          <IconButton aria-label={t('closeCreateDialog')} onClick={onClose}>
            <CloseRoundedIcon sx={{ fontSize: iconSize.lg }} />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ px: { xs: 2, md: 2.8 }, pb: 2.5 }}>
        <CreatePlatformAdminForm onCancel={onClose} onSuccess={onClose} />
      </DialogContent>
    </Dialog>
  )
}
