'use client'

import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
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
import type { FinancialEntryDetailDialogProps } from '../types/financial-entry'

export function FinancialEntryDetailDialog({
  entry,
  onClose,
  open,
}: FinancialEntryDetailDialogProps) {
  const format = useFormatter()
  const t = useTranslations('dashboard.finance.entryDetail')
  const statusT = useTranslations('dashboard.finance.statuses')
  const formatCurrency = (value: number) =>
    format.number(value, {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    })

  if (!entry) return null

  const status = financialStatusStyles[entry.status]

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ px: { xs: 2, md: 2.8 }, pb: 1.2, pt: 2.4 }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ color: brand.magenta[600], fontSize: 13, fontWeight: 900 }}>
              {t('eyebrow')}
            </Typography>
            <Typography sx={{ color: brand.graphite[500], fontSize: 22, fontWeight: 900 }}>
              {entry.description}
            </Typography>
            <Typography sx={{ color: brand.neutral[500], fontSize: 13, fontWeight: 700 }}>
              {entry.date}
            </Typography>
          </Box>
          <IconButton aria-label={t('close')} onClick={onClose}>
            <CloseRoundedIcon sx={{ fontSize: iconSize.lg }} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ px: { xs: 2, md: 2.8 }, pb: 2.6 }}>
        <Stack spacing={1.6}>
          <Box
            sx={{
              bgcolor: surface.app,
              border: '1px solid',
              borderColor: alpha.graphite[6],
              borderRadius: `${radius.sm}px`,
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 160px' },
              gap: 1.4,
              p: 1.6,
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
                  params: { id: entry.propertyId },
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
                {entry.property}
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
                  query: { contact: entry.contactId },
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
                {entry.client}
              </Typography>
            </Box>

            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ color: brand.neutral[500], fontSize: 11, fontWeight: 800 }}>
                {t('amountLabel')}
              </Typography>
              <Typography sx={{ color: brand.graphite[500], fontSize: 14, fontWeight: 900 }}>
                {formatCurrency(entry.amountValue)}
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              bgcolor: surface.paper,
              border: '1px solid',
              borderColor: alpha.graphite[6],
              borderRadius: `${radius.sm}px`,
              p: 1.6,
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1.2}>
              <Typography sx={{ color: brand.graphite[500], fontSize: 16, fontWeight: 900 }}>
                {t('receiptsTitle')}
              </Typography>
              <Chip
                label={statusT(entry.status)}
                size="small"
                sx={{
                  bgcolor: status.bgcolor,
                  color: status.color,
                  borderRadius: `${radius.full}px`,
                  fontSize: 10,
                  fontWeight: 900,
                }}
              />
            </Stack>

            <Stack spacing={1.1} sx={{ mt: 1.4 }}>
              {entry.receipts.map((receipt) => (
                <Box
                  key={receipt.id}
                  sx={{
                    bgcolor: surface.app,
                    border: '1px solid',
                    borderColor: alpha.graphite[6],
                    borderRadius: `${radius.sm}px`,
                    display: 'grid',
                    gridTemplateColumns: { xs: 'auto minmax(0, 1fr)', md: 'auto 1fr auto' },
                    gap: 1.2,
                    alignItems: 'center',
                    p: 1.2,
                  }}
                >
                  <DescriptionOutlinedIcon
                    sx={{ color: brand.magenta[600], fontSize: iconSize.xl }}
                  />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ color: brand.graphite[500], fontSize: 13, fontWeight: 900 }}>
                      {receipt.title}
                    </Typography>
                    <Typography
                      sx={{
                        color: brand.neutral[500],
                        fontSize: 12,
                        fontWeight: 700,
                        overflowWrap: 'anywhere',
                      }}
                    >
                      {receipt.issuer} · {receipt.issuedAt} · {receipt.fileName}
                    </Typography>
                  </Box>
                  <Typography
                    sx={{
                      color:
                        receipt.amountValue >= 0 ? brand.semantic.success : brand.semantic.error,
                      fontSize: 13,
                      fontWeight: 900,
                    }}
                  >
                    {formatCurrency(receipt.amountValue)}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        </Stack>
      </DialogContent>
    </Dialog>
  )
}
