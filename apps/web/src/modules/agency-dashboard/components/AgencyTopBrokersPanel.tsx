'use client'

import { Avatar, Box, ButtonBase, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { DashboardPanel } from '@modules/dashboard/components/DashboardPanel'
import { alpha, brand, motion, radius } from '@shared/theme/tokens'
import { getInitials } from '@shared/utils/get-initials'

import { agencyTopBrokers } from '../data/agency-overview'
import type { AgencyTopBroker } from '../types/agency-overview'
import { AgencyBrokerDetailDialog } from './AgencyBrokerDetailDialog'

export function AgencyTopBrokersPanel() {
  const t = useTranslations('dashboard.agencyOverview.topBrokers')
  const [selectedBroker, setSelectedBroker] = useState<AgencyTopBroker | null>(null)

  return (
    <>
      <DashboardPanel>
        <Box sx={{ minWidth: 0, p: { xs: 2, md: 2.4 } }}>
          <Typography sx={{ color: brand.graphite[500], fontSize: 15, fontWeight: 900 }}>
            {t('title')}
          </Typography>
          <Typography sx={{ mb: 1.4, color: brand.neutral[500], fontSize: 11.5, fontWeight: 700 }}>
            {t('subtitle')}
          </Typography>

          <Stack spacing={0.65}>
            {agencyTopBrokers.map((broker, index) => {
              const highlighted = index === 0

              return (
                <ButtonBase
                  key={broker.id}
                  onClick={() => setSelectedBroker(broker)}
                  sx={{
                    display: 'block',
                    width: '100%',
                    borderRadius: `${radius.sm}px`,
                    textAlign: 'left',
                    transition: motion.transition.interactive,
                    '&:hover': {
                      bgcolor: highlighted ? alpha.magenta[10] : alpha.graphite[6],
                    },
                    '&.Mui-focusVisible': {
                      boxShadow: `0 0 0 2px ${alpha.magenta[14]}`,
                    },
                  }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    sx={{
                      minHeight: 42,
                      borderRadius: `${radius.sm}px`,
                      bgcolor: highlighted ? alpha.magenta[6] : 'transparent',
                      px: 1,
                    }}
                  >
                    <Box
                      sx={{
                        display: 'grid',
                        width: 20,
                        height: 20,
                        placeItems: 'center',
                        borderRadius: '50%',
                        bgcolor:
                          index === 0 ? '#FFD635' : index === 1 ? brand.neutral[200] : '#C77C2D',
                        color: brand.graphite[500],
                        fontSize: 10,
                        fontWeight: 900,
                      }}
                    >
                      {index + 1}
                    </Box>
                    <Avatar src={broker.avatarUrl} sx={{ width: 28, height: 28, fontSize: 10 }}>
                      {getInitials(broker.name)}
                    </Avatar>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography
                        noWrap
                        sx={{ color: brand.graphite[500], fontSize: 12, fontWeight: 900 }}
                      >
                        {broker.name}
                      </Typography>
                      <Typography noWrap sx={{ color: brand.neutral[500], fontSize: 10 }}>
                        {t('sales', { count: broker.sales })}
                      </Typography>
                    </Box>
                    <Typography
                      sx={{
                        color: highlighted ? brand.magenta[600] : brand.graphite[500],
                        fontSize: 12,
                        fontWeight: 900,
                      }}
                    >
                      {broker.revenue}
                    </Typography>
                  </Stack>
                </ButtonBase>
              )
            })}
          </Stack>
        </Box>
      </DashboardPanel>

      <AgencyBrokerDetailDialog broker={selectedBroker} onClose={() => setSelectedBroker(null)} />
    </>
  )
}
