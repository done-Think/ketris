import { styles, getActivityDotStyles } from '../styles/property-detail-sidebar.styles'
import { Avatar, Box, Chip, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import type { PropertyDetailSidebarProps } from '../types/dashboard-property'

export function PropertyDetailSidebar({ property }: PropertyDetailSidebarProps) {
  const t = useTranslations('properties.detail')

  return (
    <Stack sx={styles.stack} spacing={2.8}>
      <Box sx={styles.box}>
        <Typography sx={styles.typography}>{t('participantsTitle')}</Typography>
        <Stack spacing={2}>
          {property.participants.map((participant) => (
            <Stack key={participant.name} direction="row" alignItems="center" spacing={1.5}>
              <Avatar src={participant.imageUrl} sx={styles.avatar}>
                {participant.initials}
              </Avatar>
              <Box>
                <Typography sx={styles.typography2}>{participant.name}</Typography>
                <Chip label={participant.role} size="small" sx={styles.chip} />
              </Box>
            </Stack>
          ))}
        </Stack>
      </Box>

      <Box sx={styles.box2}>
        <Typography sx={styles.typography3}>{t('activityTitle')}</Typography>
        <Stack spacing={2.4}>
          {property.activityHistory.map((activity) => (
            <Stack key={`${activity.label}-${activity.date}`} direction="row" spacing={1.7}>
              <Box sx={getActivityDotStyles(activity.tone)} />
              <Box>
                <Typography sx={styles.typography4}>{activity.label}</Typography>
                <Typography sx={styles.typography5}>{activity.date}</Typography>
              </Box>
            </Stack>
          ))}
        </Stack>
      </Box>
    </Stack>
  )
}
