'use client'

import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined'
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined'
import {
  Avatar,
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
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { alpha, brand, iconSize, radius, surface } from '@shared/theme/tokens'
import { getInitials } from '@shared/utils/get-initials'

import type { AgencyBrokerDetailDialogProps } from '../types/agency-overview'

export function AgencyBrokerDetailDialog({ broker, onClose }: AgencyBrokerDetailDialogProps) {
  const t = useTranslations('dashboard.agencyOverview.topBrokers')

  if (!broker) return null

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ px: { xs: 2, md: 2.8 }, pb: 1.2, pt: 2.4 }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
          <Stack direction="row" spacing={1.4} sx={{ alignItems: 'center', minWidth: 0 }}>
            <Avatar src={broker.avatarUrl} sx={{ width: 44, height: 44, fontSize: 14 }}>
              {getInitials(broker.name)}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ color: brand.magenta[600], fontSize: 12, fontWeight: 900 }}>
                {t('details.eyebrow')}
              </Typography>
              <Typography sx={{ color: brand.graphite[500], fontSize: 20, fontWeight: 900 }}>
                {broker.name}
              </Typography>
              <Typography sx={{ color: brand.neutral[500], fontSize: 12, fontWeight: 700 }}>
                {t('details.summary', { sales: broker.sales, revenue: broker.revenue })}
              </Typography>
            </Box>
          </Stack>
          <IconButton aria-label={t('details.close')} onClick={onClose} size="small">
            <CloseOutlinedIcon sx={{ fontSize: iconSize.lg }} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ px: { xs: 2, md: 2.8 }, pb: 2.2 }}>
        <Box
          sx={{
            bgcolor: surface.app,
            border: '1px solid',
            borderColor: alpha.graphite[6],
            borderRadius: `${radius.sm}px`,
            p: 1.6,
          }}
        >
          <Typography sx={{ mb: 1.2, color: brand.graphite[500], fontSize: 15, fontWeight: 900 }}>
            {t('details.recentSales')}
          </Typography>

          <Stack spacing={1}>
            {broker.recentSales.map((sale) => (
              <Box
                component={Link}
                href={{
                  pathname: '/dashboard/properties/[id]',
                  params: { id: sale.propertyId },
                }}
                key={sale.id}
                sx={{
                  bgcolor: surface.paper,
                  border: '1px solid',
                  borderColor: alpha.graphite[6],
                  borderRadius: `${radius.sm}px`,
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'minmax(0, 1fr) auto' },
                  gap: 1,
                  p: 1.4,
                  textDecoration: 'none',
                  transition: 'border-color 160ms ease, background-color 160ms ease',
                  '&:hover': {
                    bgcolor: alpha.magenta[6],
                    borderColor: alpha.magenta[14],
                  },
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ color: brand.graphite[500], fontSize: 13, fontWeight: 900 }}>
                    {sale.property}
                  </Typography>
                  <Typography sx={{ color: brand.neutral[500], fontSize: 11.5, fontWeight: 700 }}>
                    {sale.location} - {sale.closedAt}
                  </Typography>
                </Box>
                <Typography
                  sx={{
                    color: brand.magenta[600],
                    fontSize: 13,
                    fontWeight: 900,
                    justifySelf: { xs: 'start', sm: 'end' },
                  }}
                >
                  {sale.value}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: { xs: 2, md: 2.8 }, pb: 2.6, pt: 0 }}>
        <Button variant="outlined" onClick={onClose}>
          {t('details.close')}
        </Button>
        <Button
          component={Link}
          href={`/brokers/${broker.profileId}`}
          variant="contained"
          endIcon={<OpenInNewOutlinedIcon sx={{ fontSize: iconSize.sm }} />}
        >
          {t('details.openProfile')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
