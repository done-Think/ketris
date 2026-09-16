'use client'

import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import {
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from '@mui/material'
import { useTranslations } from 'next-intl'

import { brand, radius, surface } from '@shared/theme/tokens'

import { proposalStatusStyles } from '../config/proposal-status-styles'
import type { ProposalDetailDialogProps } from '../types/proposal'

export function ProposalDetailDialog({ onClose, open, proposal }: ProposalDetailDialogProps) {
  const t = useTranslations('dashboard.proposals')

  if (!proposal) return null

  const status = proposalStatusStyles[proposal.status]

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ px: { xs: 2, md: 2.8 }, pb: 1.2, pt: 2.4 }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ color: brand.magenta[600], fontSize: 13, fontWeight: 900 }}>
              {t('detail.eyebrow')}
            </Typography>
            <Typography sx={{ color: brand.graphite[500], fontSize: 22, fontWeight: 900 }}>
              {proposal.client}
            </Typography>
            <Typography sx={{ color: brand.neutral[500], fontSize: 13, fontWeight: 700 }}>
              {proposal.property}
            </Typography>
          </Box>
          <IconButton aria-label={t('detail.close')} onClick={onClose}>
            <CloseRoundedIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ px: { xs: 2, md: 2.8 }, pb: 2.6 }}>
        <Box
          sx={{
            bgcolor: surface.app,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: `${radius.sm}px`,
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 1.4,
            p: 1.6,
          }}
        >
          <Box>
            <Typography sx={{ color: brand.neutral[500], fontSize: 11, fontWeight: 800 }}>
              {t('detail.value')}
            </Typography>
            <Typography sx={{ color: brand.graphite[500], fontSize: 15, fontWeight: 900 }}>
              {proposal.value}
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ color: brand.neutral[500], fontSize: 11, fontWeight: 800 }}>
              {t('detail.ownerExpectation')}
            </Typography>
            <Typography sx={{ color: brand.graphite[500], fontSize: 15, fontWeight: 900 }}>
              {proposal.ownerExpectation}
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ color: brand.neutral[500], fontSize: 11, fontWeight: 800 }}>
              {t('detail.status')}
            </Typography>
            <Chip
              label={t(`statuses.${proposal.status}`)}
              sx={{
                bgcolor: status.bgcolor,
                color: status.color,
                borderRadius: `${radius.full}px`,
                fontWeight: 900,
                mt: 0.6,
              }}
            />
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  )
}
