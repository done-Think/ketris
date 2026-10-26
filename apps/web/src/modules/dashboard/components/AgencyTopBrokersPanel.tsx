'use client'

import { Avatar, Box, ButtonBase, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { DashboardPanel } from '@shared/components/ui/DashboardPanel'
import { getInitials } from '@shared/utils/get-initials'

import type { AgencyTopBroker, AgencyTopBrokersPanelProps } from '../types/agency-overview'
import { AgencyBrokerDetailDialog } from './AgencyBrokerDetailDialog'
import {
  getBrokerButtonStyles,
  getBrokerRowStyles,
  getRankStyles,
  getRevenueStyles,
  styles,
} from '../styles/agency-top-brokers-panel.styles'

export function AgencyTopBrokersPanel({ topBrokers }: AgencyTopBrokersPanelProps) {
  const t = useTranslations('dashboard.agencyOverview.topBrokers')
  const [selectedBroker, setSelectedBroker] = useState<AgencyTopBroker | null>(null)

  return (
    <>
      <DashboardPanel>
        <Box sx={styles.box}>
          <Typography sx={styles.typography}>{t('title')}</Typography>
          <Typography sx={styles.typography2}>{t('subtitle')}</Typography>

          <Stack spacing={0.65}>
            {topBrokers.map((broker, index) => {
              const highlighted = index === 0

              return (
                <ButtonBase
                  key={broker.id}
                  onClick={() => setSelectedBroker(broker)}
                  sx={getBrokerButtonStyles(highlighted)}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    sx={getBrokerRowStyles(highlighted)}
                  >
                    <Box sx={getRankStyles(index)}>{index + 1}</Box>
                    <Avatar src={broker.avatarUrl ?? undefined} sx={styles.avatar}>
                      {getInitials(broker.name)}
                    </Avatar>
                    <Box sx={styles.box2}>
                      <Typography noWrap sx={styles.typography3}>
                        {broker.name}
                      </Typography>
                      <Typography noWrap sx={styles.typography4}>
                        {t('sales', { count: broker.sales })}
                      </Typography>
                    </Box>
                    <Typography sx={getRevenueStyles(highlighted)}>{broker.revenue}</Typography>
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
