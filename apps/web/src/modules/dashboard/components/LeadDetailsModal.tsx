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

import { alpha, brand, radius } from '@shared/theme/tokens'

import type { LeadBriefingItemProps, LeadDetailsModalProps } from '../types/dashboard-overview'
import { ContactInfoCard } from './ContactInfoCard'

function LeadBriefingItem({ label, value }: LeadBriefingItemProps) {
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: alpha.graphite[6],
        borderRadius: `${radius.sm}px`,
        p: 1.4,
      }}
    >
      <Typography sx={{ color: brand.neutral[500], fontSize: 11, fontWeight: 900 }}>
        {label}
      </Typography>
      <Typography sx={{ color: brand.graphite[500], fontSize: 13, fontWeight: 800, mt: 0.6 }}>
        {value}
      </Typography>
    </Box>
  )
}

export function LeadDetailsModal({ lead, onClose }: LeadDetailsModalProps) {
  const t = useTranslations('dashboard.overview.leadDetails')

  return (
    <Dialog
      open={Boolean(lead)}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      slotProps={{
        paper: {
          sx: {
            borderRadius: `${radius.sm}px`,
            overflow: 'hidden',
          },
        },
      }}
    >
      {lead ? (
        <>
          <DialogTitle sx={{ px: { xs: 2, md: 2.6 }, py: 2 }}>
            <Stack
              direction="row"
              alignItems="flex-start"
              justifyContent="space-between"
              spacing={2}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ color: brand.neutral[500], fontSize: 11, fontWeight: 900 }}>
                  {t('title')}
                </Typography>
                <Typography
                  noWrap
                  sx={{ color: brand.graphite[500], fontSize: { xs: 20, md: 24 }, fontWeight: 900 }}
                >
                  {lead.name}
                </Typography>
              </Box>
              <IconButton aria-label={t('close')} onClick={onClose} size="small">
                <CloseIcon fontSize="small" />
              </IconButton>
            </Stack>
          </DialogTitle>

          <DialogContent sx={{ px: { xs: 2, md: 2.6 }, pb: 2.6 }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
                gap: 1,
              }}
            >
              <ContactInfoCard label={t('client')} name={lead.name} phone={lead.phone} />
              <LeadBriefingItem label={t('interest')} value={lead.interest} />
              <LeadBriefingItem label={t('budget')} value={lead.budget} />
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 1,
                mt: 1,
              }}
            >
              <LeadBriefingItem label={t('origin')} value={lead.source} />
            </Box>

            <Box
              sx={{
                border: '1px solid',
                borderColor: alpha.graphite[6],
                borderRadius: `${radius.sm}px`,
                p: 1.4,
                mt: 1,
              }}
            >
              <Typography sx={{ color: brand.neutral[500], fontSize: 11, fontWeight: 900 }}>
                {t('notes')}
              </Typography>
              <Typography
                sx={{ color: brand.graphite[500], fontSize: 13, fontWeight: 700, mt: 0.6 }}
              >
                {lead.notes || t('noNotes')}
              </Typography>
            </Box>
          </DialogContent>
        </>
      ) : null}
    </Dialog>
  )
}
