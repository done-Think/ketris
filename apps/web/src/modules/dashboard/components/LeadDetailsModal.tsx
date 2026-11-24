'use client'

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import { useLocale, useTranslations } from 'next-intl'

import type { AppLocale } from '@/i18n/types/locale.types'
import { Link } from '@/i18n/navigation'
import { formatLeadBudget } from '@shared/lib/utils/lead-budget'

import { leadSourceKey } from '@shared/config/lead-sources'
import type { LeadDetailsModalProps } from '../types/dashboard-overview'
import { ContactInfoCard } from './ContactInfoCard'
import { LeadBriefingItem } from './LeadBriefingItem'
import { styles } from '../styles/lead-details-modal.styles'

export function LeadDetailsModal({ lead, onClose }: LeadDetailsModalProps) {
  const locale = useLocale() as AppLocale
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
              <LeadBriefingItem label={t('budget')} value={formatLeadBudget(lead.budget, locale)} />
            </Box>

            <Box sx={styles.box4}>
              <LeadBriefingItem label={t('origin')} value={sourceT(leadSourceKey(lead.source))} />
            </Box>

            <Box sx={styles.box5}>
              <Typography sx={styles.typography}>{t('notes')}</Typography>
              <Typography sx={styles.typography4}>{lead.notes || t('noNotes')}</Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={styles.dialogActions}>
            <Button
              component={Link}
              href={`/dashboard/leads?leadId=${encodeURIComponent(lead.id)}`}
              variant="contained"
              endIcon={<ArrowForwardRoundedIcon fontSize="small" />}
              onClick={onClose}
            >
              {t('openLead')}
            </Button>
          </DialogActions>
        </>
      ) : null}
    </Dialog>
  )
}
