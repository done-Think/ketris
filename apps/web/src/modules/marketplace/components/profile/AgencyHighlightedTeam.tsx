'use client'

import { Avatar, Box, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'

import type { AgencyHighlightedTeamProps } from '../../types/agency-highlighted-team'
import { buildPublicProfileHref } from '../../utils/property-links'
import {
  styles,
  getBoxStyles,
  getTypographyStyles,
} from '../../styles/agency-highlighted-team.styles'

export function AgencyHighlightedTeam({ brand, team }: AgencyHighlightedTeamProps) {
  const t = useTranslations('marketplace.publicProfile')
  return (
    <Box sx={styles.box}>
      <Typography variant="h5" sx={styles.typography}>
        {t('featuredTeam')}
      </Typography>
      <Box sx={styles.box2}>
        {team.map((member) => (
          <Box
            key={member.userId}
            component={Link}
            href={buildPublicProfileHref(`/brokers/${member.userId}`, 'broker')}
            aria-label={t('viewBrokerProfile', { name: member.name })}
            sx={getBoxStyles({ brand })}
          >
            <Avatar src={member.avatarUrl ?? undefined} alt={member.name} sx={styles.avatar} />
            <Box sx={styles.box3}>
              <Typography noWrap sx={getTypographyStyles({ brand })}>
                {member.name}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  )
}
