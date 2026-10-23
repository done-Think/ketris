'use client'

import { Box, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { brand, radius, surface } from '@shared/theme/tokens'
import type { MaintenanceTicketSectionProps } from '../../types/maintenance-detail'
import { cardSx, cardTitleSx } from './styles'

export function MaintenanceTicketAttachments({ ticket }: MaintenanceTicketSectionProps) {
  const detailT = useTranslations('dashboard.maintenance.detail')

  return (
    <Box sx={cardSx}>
      <Typography sx={cardTitleSx}>{detailT('photos.title')}</Typography>
      {ticket.attachments.length > 0 ? (
        <Stack direction="row" spacing={1.4} flexWrap="wrap" useFlexGap sx={{ mt: 1.4 }}>
          {ticket.attachments.map((attachment) => (
            <Box
              key={attachment.id}
              sx={{
                position: 'relative',
                width: { xs: '50%', sm: 160 },
                height: 105,
                borderRadius: `${radius.sm}px`,
                overflow: 'hidden',
                backgroundImage: `url(${attachment.url})`,
                backgroundPosition: 'center',
                backgroundSize: 'cover',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  inset: 'auto 0 0',
                  px: 0.8,
                  py: 0.35,
                  bgcolor: 'rgba(13,15,20,.62)',
                  color: surface.lightText,
                  fontSize: 10,
                }}
              >
                {attachment.name}
              </Box>
            </Box>
          ))}
        </Stack>
      ) : (
        <Typography sx={{ mt: 1.4, color: brand.neutral[400], fontSize: 12 }}>
          {detailT('photos.empty')}
        </Typography>
      )}
    </Box>
  )
}
