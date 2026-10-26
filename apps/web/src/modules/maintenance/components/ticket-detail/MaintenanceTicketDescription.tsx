'use client'

import { Box, Divider, Typography } from '@mui/material'
import { useTranslations, useFormatter } from 'next-intl'
import { formatDate } from '@shared/lib/utils/format'
import { brand } from '@shared/theme/tokens'
import type { MaintenanceTicketSectionProps } from '../../types/maintenance-detail'
import { cardSx, labelSx, cardTitleSx } from './styles'

export function MaintenanceTicketDescription({ ticket }: MaintenanceTicketSectionProps) {
  const t = useTranslations('dashboard.maintenance')
  const detailT = useTranslations('dashboard.maintenance.detail')
  const formatter = useFormatter()

  return (
    <Box sx={cardSx}>
      <Typography sx={cardTitleSx}>{detailT('descriptionCard.title')}</Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
          gap: 1.5,
          mt: 1.7,
        }}
      >
        {[
          [t('columns.property'), ticket.propertyTitle],
          [t('columns.category'), t(`categories.${ticket.category}`)],
          [detailT('descriptionCard.openedBy'), ticket.openedByName],
          [t('columns.openedAt'), formatDate(ticket.createdAt)],
          [
            t('schedule.summaryLabel'),
            ticket.scheduledAt
              ? formatter.dateTime(new Date(ticket.scheduledAt), {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })
              : t('scheduleNotSet'),
          ],
        ].map(([label, value]) => (
          <Box key={label}>
            <Typography sx={labelSx}>{label}</Typography>
            <Typography
              sx={{ mt: 0.35, color: brand.graphite[500], fontSize: 12, fontWeight: 900 }}
            >
              {value}
            </Typography>
          </Box>
        ))}
      </Box>
      <Divider sx={{ my: 1.8 }} />
      <Typography sx={labelSx}>{detailT('descriptionCard.report')}</Typography>
      <Typography sx={{ mt: 0.7, color: brand.neutral[600], fontSize: 13, lineHeight: 1.5 }}>
        {ticket.description}
      </Typography>
    </Box>
  )
}
