'use client'

import { Avatar, Box, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import type { BrokerProfileHeroProps } from '../../types/broker'
import { styles, getBoxStyles, getBoxStyles2 } from '../../styles/broker-profile-hero.styles'

export function BrokerProfileHero({ broker }: BrokerProfileHeroProps) {
  const t = useTranslations('marketplace.publicProfile')
  return (
    <Box sx={styles.box}>
      <Box sx={getBoxStyles({ broker })}>
        <Box sx={styles.box2}>
          <Typography sx={styles.typography}>
            {broker.headline ?? t('brokerDefaultHeadline')}
          </Typography>
        </Box>
      </Box>

      <Box sx={getBoxStyles2({ broker })}>
        <Avatar src={broker.avatar ?? undefined} alt={broker.name} sx={styles.avatar} />
        <Box sx={styles.box3}>
          <Typography component="h1" sx={styles.typography2}>
            {broker.name}
          </Typography>
          <Typography sx={styles.typography3}>
            {[broker.creci, broker.region].filter(Boolean).join(' / ')}
          </Typography>
        </Box>
      </Box>

      <Box sx={styles.box4}>
        <Typography sx={styles.typography4}>{broker.bio}</Typography>
      </Box>
    </Box>
  )
}
