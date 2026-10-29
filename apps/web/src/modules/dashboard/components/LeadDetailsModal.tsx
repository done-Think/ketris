'use client'

import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { useTranslations } from 'next-intl'

import { leadSourceKey } from '@shared/config/lead-sources'
import type { LeadDetailsModalProps } from '../types/dashboard-overview'
import { ContactInfoCard } from './ContactInfoCard'
import { LeadBriefingItem } from './LeadBriefingItem'
import { styles } from '../styles/lead-details-modal.styles'

export function LeadDetailsModal({ lead, onClose }: LeadDetailsModalProps) {
  const t = useTranslations('dashboard.overview.leadDetails')
  const sourceT = useTranslations('dashboard.leadSources')

  return (
    <Dialog
      open={Boolean(lead)}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      slotProps={{
        paper: {
          sx: styles.paper,
        },
      }}
    >
      {lead ? (
        <>
          <DialogTitle sx={styles.dialogTitle}>
            <Stack
              direction="row"
              alignItems="flex-start"
              justifyContent="space-between"
              spacing={2}
            >
              <Box sx={styles.box2}>
                <Typography sx={styles.typography}>{t('title')}</Typography>
                <Typography noWrap sx={styles.typography3}>
                  {lead.name}
                </Typography>
              </Box>
              <IconButton aria-label={t('close')} onClick={onClose} size="small">
                <CloseIcon fontSize="small" />
              </IconButton>
            </Stack>
          </DialogTitle>

          <DialogContent sx={styles.dialogContent}>
            <Box sx={styles.box3}>
              <ContactInfoCard label={t('client')} name={lead.name} phone={lead.phone} />
              <LeadBriefingItem label={t('interest')} value={lead.interest} />
              <LeadBriefingItem label={t('budget')} value={lead.budget} />
            </Box>

            <Box sx={styles.box4}>
              <LeadBriefingItem label={t('origin')} value={sourceT(leadSourceKey(lead.source))} />
            </Box>

            <Box sx={styles.box5}>
              <Typography sx={styles.typography}>{t('notes')}</Typography>
              <Typography sx={styles.typography4}>{lead.notes || t('noNotes')}</Typography>
            </Box>
          </DialogContent>
        </>
      ) : null}
    </Dialog>
  )
}
