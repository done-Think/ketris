'use client'

import * as maintenanceStyles from '../../styles/maintenance-ticket-description.styles'

import { Box, Divider, Typography } from '@mui/material'
import { useFormatter, useTranslations } from 'next-intl'
import { cardSx, cardTitleSx, labelSx } from '../../styles/maintenance-ticket-detail.styles'
import type { MaintenanceTicketSectionProps } from '../../types/maintenance-detail'
import { formatMaintenanceCategory } from '../../utils/maintenance-category'

export function MaintenanceTicketDescription({ ticket }: MaintenanceTicketSectionProps) {
  const t = useTranslations('dashboard.maintenance')
  const detailT = useTranslations('dashboard.maintenance.detail')
  const formatter = useFormatter()

  return (
    <Box sx={cardSx}>
      <Typography sx={cardTitleSx}>{detailT('descriptionCard.title')}</Typography>
      <Box sx={maintenanceStyles.boxSx}>
        {[
          [t('columns.property'), ticket.propertyTitle],
          [
            t('columns.category'),
            formatMaintenanceCategory(ticket.category, (key) => t(`categories.${key}`)),
          ],
          [detailT('descriptionCard.openedBy'), ticket.openedByName],
          [t('columns.openedAt'), formatter.dateTime(new Date(ticket.createdAt), 'short')],
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
            <Typography sx={maintenanceStyles.typographySx}>{value}</Typography>
          </Box>
        ))}
      </Box>
      <Divider sx={maintenanceStyles.dividerSx} />
      <Typography sx={labelSx}>{detailT('descriptionCard.report')}</Typography>
      <Typography sx={maintenanceStyles.typographySx2}>{ticket.description}</Typography>
    </Box>
  )
}
