'use client'

import * as maintenanceStyles from '../../styles/maintenance-ticket-information.styles'

import { Box, Stack, Typography } from '@mui/material'
import { useFormatter, useTranslations } from 'next-intl'
import { cardSx, cardTitleSx } from '../../styles/maintenance-ticket-detail.styles'
import type { MaintenanceTicketSectionProps } from '../../types/maintenance-detail'

export function MaintenanceTicketInformation({ ticket }: MaintenanceTicketSectionProps) {
  const t = useTranslations('dashboard.maintenance')
  const formatter = useFormatter()
  const detailT = useTranslations('dashboard.maintenance.detail')

  return (
    <Box sx={cardSx}>
      <Typography sx={cardTitleSx}>{detailT('info.title')}</Typography>
      <Stack spacing={1.1} sx={maintenanceStyles.stackSx}>
        {[
          [
            t('columns.openedAt'),
            detailT('info.dateTime', {
              date: formatter.dateTime(new Date(ticket.createdAt), 'short'),
              time: formatter.dateTime(new Date(ticket.createdAt), {
                hour: '2-digit',
                minute: '2-digit',
              }),
            }),
          ],
          [
            detailT('info.lastUpdated'),
            detailT('info.dateTime', {
              date: formatter.dateTime(new Date(ticket.updatedAt), 'short'),
              time: formatter.dateTime(new Date(ticket.updatedAt), {
                hour: '2-digit',
                minute: '2-digit',
              }),
            }),
          ],
        ].map(([label, value]) => (
          <Stack key={label} direction="row" justifyContent="space-between" spacing={1}>
            <Typography sx={maintenanceStyles.typographySx}>{label}</Typography>
            <Typography sx={maintenanceStyles.typographySx2}>{value}</Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  )
}
