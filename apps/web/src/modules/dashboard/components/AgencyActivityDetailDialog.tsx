'use client'

import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined'
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from '@mui/material'
import { useTranslations } from 'next-intl'

import type {
  AgencyActivityDetailDialogProps,
  AgencyActivityDetailField,
} from '../types/agency-overview'
import { styles } from '../styles/agency-activity-detail-dialog.styles'

export function AgencyActivityDetailDialog({ activity, onClose }: AgencyActivityDetailDialogProps) {
  const t = useTranslations('dashboard.agencyOverview.activity')

  if (!activity) return null

  const fields: AgencyActivityDetailField[] = [
    { label: t('details.fields.subject'), value: activity.detail },
    { label: t('details.fields.time'), value: activity.occurredAtLabel },
  ]

  if (activity.broker) {
    fields.unshift({ label: t('details.fields.broker'), value: activity.broker })
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={styles.dialogTitle}>
        <Stack spacing={1.4}>
          <Stack direction="row" spacing={1.2} sx={styles.stack}>
            <Stack spacing={0.6} sx={styles.stack2}>
              <Typography sx={styles.typography}>{t('details.eyebrow')}</Typography>
              <Typography sx={styles.typography2}>{activity.detail}</Typography>
            </Stack>
            <IconButton aria-label={t('details.close')} onClick={onClose} size="small">
              <CloseOutlinedIcon sx={styles.closeOutlinedIcon} />
            </IconButton>
          </Stack>

          <Chip label={t(`details.tones.${activity.tone}`)} size="small" sx={styles.chip} />
        </Stack>
      </DialogTitle>

      <DialogContent sx={styles.dialogContent}>
        <Box sx={styles.box}>
          <Box sx={styles.box2}>
            {fields.map((field) => (
              <Stack key={field.label} spacing={0.3} sx={styles.stack2}>
                <Typography sx={styles.typography3}>{field.label}</Typography>
                <Typography sx={styles.typography4}>{field.value}</Typography>
              </Stack>
            ))}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={styles.dialogActions}>
        <Button variant="contained" onClick={onClose}>
          {t('details.close')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
