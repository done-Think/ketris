'use client'

import { Box, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { formatDate } from '@shared/lib/utils/format'
import { brand } from '@shared/theme/tokens'
import type { MaintenanceTicketSectionProps } from '../../types/maintenance-detail'
import { cardSx, cardTitleSx } from './styles'

export function MaintenanceTicketInformation({ ticket }: MaintenanceTicketSectionProps) {
  const t = useTranslations('dashboard.maintenance')
  const detailT = useTranslations('dashboard.maintenance.detail')

  return (
    <Box sx={cardSx}>
      <Typography sx={cardTitleSx}>{detailT('info.title')}</Typography>
      <Stack spacing={1.1} sx={{ mt: 1.6 }}>
        {[
          [
            t('columns.openedAt'),
            detailT('info.dateTime', {
              date: formatDate(ticket.createdAt),
              time: formatDate(ticket.createdAt, 'HH:mm'),
            }),
          ],
          [
            detailT('info.lastUpdated'),
            detailT('info.dateTime', {
              date: formatDate(ticket.updatedAt),
              time: formatDate(ticket.updatedAt, 'HH:mm'),
            }),
          ],
        ].map(([label, value]) => (
          <Stack key={label} direction="row" justifyContent="space-between" spacing={1}>
            <Typography sx={{ fontSize: 11, color: brand.neutral[500] }}>{label}</Typography>
            <Typography
              sx={{
                fontSize: 11,
                color: brand.graphite[500],
                fontWeight: 800,
                textAlign: 'right',
              }}
            >
              {value}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  )
}
