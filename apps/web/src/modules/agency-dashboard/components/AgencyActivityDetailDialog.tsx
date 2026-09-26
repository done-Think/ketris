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
  Divider,
  IconButton,
  Stack,
  Typography,
} from '@mui/material'
import { useTranslations } from 'next-intl'

import { alpha, brand, iconSize, radius, surface } from '@shared/theme/tokens'

import type {
  AgencyActivityDetailDialogProps,
  AgencyActivityDetailField,
} from '../types/agency-overview'

export function AgencyActivityDetailDialog({ activity, onClose }: AgencyActivityDetailDialogProps) {
  const t = useTranslations('dashboard.agencyOverview.activity')

  if (!activity) return null

  const detailBase = `details.items.${activity.detailKey}`
  const fields: AgencyActivityDetailField[] = [
    { label: t('details.fields.subject'), value: t(`${detailBase}.subject`) },
    { label: t('details.fields.status'), value: t(`${detailBase}.status`) },
    { label: t('details.fields.nextStep'), value: t(`${detailBase}.nextStep`) },
    { label: t('details.fields.time'), value: activity.timeAgo },
  ]

  if (activity.broker) {
    fields.unshift({ label: t('details.fields.broker'), value: activity.broker })
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ px: { xs: 2, md: 2.8 }, pb: 1.2, pt: 2.4 }}>
        <Stack spacing={1.4}>
          <Stack
            direction="row"
            spacing={1.2}
            sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}
          >
            <Stack spacing={0.6} sx={{ minWidth: 0 }}>
              <Typography sx={{ color: brand.magenta[600], fontSize: 12, fontWeight: 900 }}>
                {t('details.eyebrow')}
              </Typography>
              <Typography sx={{ color: brand.graphite[500], fontSize: 20, fontWeight: 900 }}>
                {t(`${detailBase}.title`)}
              </Typography>
            </Stack>
            <IconButton aria-label={t('details.close')} onClick={onClose} size="small">
              <CloseOutlinedIcon sx={{ fontSize: iconSize.lg }} />
            </IconButton>
          </Stack>

          <Chip
            label={t(`${detailBase}.status`)}
            size="small"
            sx={{
              alignSelf: 'flex-start',
              bgcolor: alpha.magenta[8],
              color: brand.magenta[700],
              fontSize: 12,
              fontWeight: 900,
            }}
          />
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ bgcolor: surface.paper, px: { xs: 2, md: 2.8 }, pb: 2.2 }}>
        <Stack spacing={1.8}>
          <Typography sx={{ color: brand.neutral[500], fontSize: 13, fontWeight: 700 }}>
            {t(`${detailBase}.description`)}
          </Typography>

          <Box
            sx={{
              border: '1px solid',
              borderColor: alpha.graphite[8],
              borderRadius: `${radius.sm}px`,
              p: 2,
            }}
          >
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
                gap: 1.4,
              }}
            >
              {fields.map((field) => (
                <Stack key={field.label} spacing={0.3} sx={{ minWidth: 0 }}>
                  <Typography sx={{ color: brand.neutral[500], fontSize: 11, fontWeight: 900 }}>
                    {field.label}
                  </Typography>
                  <Typography sx={{ color: brand.graphite[500], fontSize: 13, fontWeight: 800 }}>
                    {field.value}
                  </Typography>
                </Stack>
              ))}
            </Box>

            <Divider sx={{ my: 1.6 }} />

            <Stack spacing={0.4}>
              <Typography sx={{ color: brand.neutral[500], fontSize: 11, fontWeight: 900 }}>
                {t('details.fields.summary')}
              </Typography>
              <Typography sx={{ color: brand.graphite[500], fontSize: 13, fontWeight: 800 }}>
                {t(activity.actionKey, { broker: activity.broker, detail: activity.detail })}
              </Typography>
            </Stack>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: { xs: 2, md: 2.8 }, pb: 2.6, pt: 0 }}>
        <Button variant="contained" onClick={onClose}>
          {t('details.close')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
