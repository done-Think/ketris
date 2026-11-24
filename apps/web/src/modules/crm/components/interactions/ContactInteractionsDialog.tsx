'use client'

import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import {
  Alert,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from '@mui/material'
import { useTranslations } from 'next-intl'
import type { ContactInteractionsDialogProps } from '../../types/interaction'
import { interactionStyles as styles } from '../../styles/interaction.styles'
import { InteractionHistory } from './InteractionHistory'

export function ContactInteractionsDialog({
  contact,
  onClose,
  attempt,
}: ContactInteractionsDialogProps) {
  const t = useTranslations('crm.interactions')
  return (
    <Dialog open={Boolean(contact)} onClose={onClose} fullWidth maxWidth="sm">
      {contact && (
        <>
          <DialogTitle sx={styles.dialogTitle}>
            <Typography component="span" variant="h6">
              {contact.name}
            </Typography>
            <IconButton aria-label={t('close')} onClick={onClose}>
              <CloseRoundedIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2}>
              <Alert severity="info">{t('contactScope')}</Alert>
              {attempt?.isPending && <Alert severity="info">{t('recording')}</Alert>}
              {attempt?.isSuccess && <Alert severity="info">{t('attemptRecorded')}</Alert>}
              {attempt?.failed && (
                <Alert
                  severity="warning"
                  action={<Button onClick={attempt.retry}>{t('retryRecord')}</Button>}
                >
                  {t('startError')}
                </Alert>
              )}
              <InteractionHistory key={contact.id} target={{ kind: 'contact', id: contact.id }} />
            </Stack>
          </DialogContent>
        </>
      )}
    </Dialog>
  )
}
