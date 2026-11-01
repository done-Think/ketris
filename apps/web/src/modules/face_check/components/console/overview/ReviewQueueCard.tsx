'use client'

import { Avatar, Box, Link as MuiLink, List, ListItemButton, Typography } from '@mui/material'
import { useFormatter, useNow, useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

import { getInitials } from '../../../utils/get-initials'

import type { OverviewSectionProps } from '../../../types/console.types'
import { cardStyles, overviewStyles as styles } from '../../../styles/console.styles'

export function ReviewQueueCard({ overview }: OverviewSectionProps) {
  const t = useTranslations('face_check.console.overview.queue')
  const tReasons = useTranslations('face_check.console.reviewReasons')
  const format = useFormatter()
  const now = useNow({ updateInterval: 60 * 1000 })

  return (
    <Box component="section" aria-labelledby="review-queue" sx={cardStyles.card}>
      <Box sx={cardStyles.header}>
        <Typography id="review-queue" component="h2" sx={cardStyles.title}>
          {t('title')}
        </Typography>
        <MuiLink
          component={Link}
          href={{ pathname: '/dashboard/face_check/sessions', query: { filter: 'review' } }}
        >
          {t('seeAll')}
        </MuiLink>
      </Box>
      {overview.reviewQueue.length === 0 ? (
        <Typography sx={cardStyles.empty}>{t('empty')}</Typography>
      ) : (
        <List disablePadding>
          {overview.reviewQueue.map((session) => (
            <ListItemButton
              key={session.id}
              component={Link}
              href={{ pathname: '/dashboard/face_check/sessions/[id]', params: { id: session.id } }}
              sx={styles.queueItem}
            >
              <Avatar sx={styles.queueAvatar}>{getInitials(session.personName)}</Avatar>
              <Box sx={styles.queueText}>
                <Typography sx={styles.queueName}>{session.personName}</Typography>
                <Typography sx={styles.queueReason}>
                  {session.reviewReason ? tReasons(session.reviewReason) : '—'}
                </Typography>
              </Box>
              <Typography sx={styles.queueWait}>
                {format.relativeTime(new Date(session.updatedAt), now)}
              </Typography>
            </ListItemButton>
          ))}
        </List>
      )}
    </Box>
  )
}
