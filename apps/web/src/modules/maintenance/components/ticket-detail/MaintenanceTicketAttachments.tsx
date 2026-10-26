'use client'

import * as maintenanceStyles from '../../styles/maintenance-ticket-attachments.styles'

import { Box, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { cardSx, cardTitleSx } from '../../styles/maintenance-ticket-detail.styles'
import type { MaintenanceTicketSectionProps } from '../../types/maintenance-detail'

export function MaintenanceTicketAttachments({ ticket }: MaintenanceTicketSectionProps) {
  const detailT = useTranslations('dashboard.maintenance.detail')

  return (
    <Box sx={cardSx}>
      <Typography sx={cardTitleSx}>{detailT('photos.title')}</Typography>
      {ticket.attachments.length > 0 ? (
        <Stack
          direction="row"
          spacing={1.4}
          flexWrap="wrap"
          useFlexGap
          sx={maintenanceStyles.stackSx}
        >
          {ticket.attachments.map((attachment) => (
            <Box key={attachment.id} sx={maintenanceStyles.getBoxSx(attachment)}>
              <Box sx={maintenanceStyles.boxSx}>{attachment.name}</Box>
            </Box>
          ))}
        </Stack>
      ) : (
        <Typography sx={maintenanceStyles.typographySx}>{detailT('photos.empty')}</Typography>
      )}
    </Box>
  )
}
