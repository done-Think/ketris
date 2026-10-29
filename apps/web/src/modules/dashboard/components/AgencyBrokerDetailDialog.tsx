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
import { getInitials } from '@shared/utils/get-initials'

import type { AgencyBrokerDetailDialogProps } from '../types/agency-overview'
import { styles } from '../styles/agency-broker-detail-dialog.styles'

export function AgencyBrokerDetailDialog({ broker, onClose }: AgencyBrokerDetailDialogProps) {
  const t = useTranslations('dashboard.agencyOverview.topBrokers')

  if (!broker) return null

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={styles.dialogTitle}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
          <Stack direction="row" spacing={1.4} sx={styles.stack}>
            <Avatar src={broker.avatarUrl ?? undefined} sx={styles.avatar}>
              {getInitials(broker.name)}
            </Avatar>
            <Box sx={styles.box}>
              <Typography sx={styles.typography}>{t('details.eyebrow')}</Typography>
              <Typography sx={styles.typography2}>{broker.name}</Typography>
              <Typography sx={styles.typography3}>
                {t('details.summary', { sales: broker.sales, revenue: broker.revenue })}
              </Typography>
            </Box>
          </Stack>
          <IconButton aria-label={t('details.close')} onClick={onClose} size="small">
            <CloseOutlinedIcon sx={styles.closeOutlinedIcon} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={styles.dialogContent}>
        <Box sx={styles.box2}>
          <Typography sx={styles.typography4}>{t('details.recentSales')}</Typography>

          <Stack spacing={1}>
            {broker.recentSales.map((sale) => (
              <Box
                component={Link}
                href={{
                  pathname: '/dashboard/properties/[id]',
                  params: { id: sale.propertyId },
                }}
                key={sale.id}
                sx={styles.box3}
              >
                <Box sx={styles.box}>
                  <Typography sx={styles.typography5}>{sale.property}</Typography>
                  <Typography sx={styles.typography6}>
                    {sale.location ? `${sale.location} - ${sale.closedAt}` : sale.closedAt}
                  </Typography>
                </Box>
                <Typography sx={styles.typography7}>{sale.value}</Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      </DialogContent>

      <DialogActions sx={styles.dialogActions}>
        <Button variant="outlined" onClick={onClose}>
          {t('details.close')}
        </Button>
        {broker.hasPublicProfile ? (
          <Button
            component={Link}
            href={`/brokers/${broker.profileId}`}
            variant="contained"
            endIcon={<OpenInNewOutlinedIcon sx={styles.openInNewOutlinedIcon} />}
          >
            {t('details.openProfile')}
          </Button>
        ) : null}
      </DialogActions>
    </Dialog>
  )
}
