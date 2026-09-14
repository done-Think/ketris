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
import { useFormatter, useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { alpha, brand, iconSize, radius, surface } from '@shared/theme/tokens'

import { financialStatusStyles } from '../config/financial-status-styles'
import type { FinancialDueHistoryDialogProps } from '../types/financial-entry'

export function FinancialDueHistoryDialog({ due, onClose, open }: FinancialDueHistoryDialogProps) {
  const format = useFormatter()
  const t = useTranslations('dashboard.finance.history')
  const statusT = useTranslations('dashboard.finance.statuses')
  const formatCurrency = (value: number) =>
    format.number(value, {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    })

  if (!due) return null

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ px: { xs: 2, md: 2.8 }, pb: 1.2, pt: 2.4 }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ color: brand.magenta[600], fontSize: 13, fontWeight: 900 }}>
              {t('eyebrow')}
            </Typography>
            <Typography sx={{ color: brand.graphite[500], fontSize: 22, fontWeight: 900 }}>
              {due.property}
            </Typography>
            <Typography sx={{ color: brand.neutral[500], fontSize: 13, fontWeight: 700 }}>
              {due.client}
            </Typography>
          </Box>
          <IconButton aria-label={t('close')} onClick={onClose}>
            <CloseRoundedIcon sx={{ fontSize: iconSize.lg }} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ px: { xs: 2, md: 2.8 }, pb: 2.6 }}>
        <Stack spacing={1.2}>
          <Box
            sx={{
              bgcolor: surface.app,
              border: '1px solid',
              borderColor: alpha.graphite[6],
              borderRadius: `${radius.sm}px`,
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 1.2,
              p: 1.4,
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ color: brand.neutral[500], fontSize: 11, fontWeight: 800 }}>
                {t('propertyLabel')}
              </Typography>
              <Typography
                component={Link}
                href={{
                  pathname: '/dashboard/properties/[id]',
                  params: { id: due.propertyId },
                }}
                sx={{
                  color: brand.graphite[500],
                  display: 'block',
                  fontSize: 14,
                  fontWeight: 900,
                  overflowWrap: 'anywhere',
                  textDecoration: 'none',
                  '&:hover': { color: brand.magenta[700] },
                }}
              >
                {due.property}
              </Typography>
            </Box>

            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ color: brand.neutral[500], fontSize: 11, fontWeight: 800 }}>
                {t('clientLabel')}
              </Typography>
              <Typography
                component={Link}
                href={{
                  pathname: '/crm/contacts',
                  query: { contact: due.contactId },
                }}
                sx={{
                  color: brand.graphite[500],
                  display: 'block',
                  fontSize: 14,
                  fontWeight: 900,
                  overflowWrap: 'anywhere',
                  textDecoration: 'none',
                  '&:hover': { color: brand.magenta[700] },
                }}
              >
                {due.client}
              </Typography>
            </Box>
          </Box>

          {due.history.map((entry) => {
            const status = financialStatusStyles[entry.status]

            return (
              <Box
                key={entry.id}
                sx={{
                  bgcolor: surface.app,
                  border: '1px solid',
                  borderColor: alpha.graphite[6],
                  borderRadius: `${radius.sm}px`,
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '90px minmax(0, 1fr) auto auto' },
                  gap: 1.2,
                  alignItems: 'center',
                  p: 1.4,
                }}
              >
                <Typography sx={{ color: brand.neutral[500], fontSize: 12, fontWeight: 800 }}>
                  {entry.date}
                </Typography>
                <Typography sx={{ color: brand.graphite[500], fontSize: 13, fontWeight: 900 }}>
                  {entry.description}
                </Typography>
                <Typography sx={{ color: brand.graphite[500], fontSize: 13, fontWeight: 900 }}>
                  {formatCurrency(entry.amountValue)}
                </Typography>
                <Chip
                  label={statusT(entry.status)}
                  size="small"
                  sx={{
                    justifySelf: { xs: 'start', sm: 'end' },
                    bgcolor: status.bgcolor,
                    color: status.color,
                    borderRadius: `${radius.full}px`,
                    fontSize: 10,
                    fontWeight: 900,
                  }}
                />
              </Box>
            )
          })}
        </Stack>
      </DialogContent>
    </Dialog>
  )
}
