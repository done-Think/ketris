import { styles, getActivityDotStyles } from '../styles/property-detail-sidebar.styles'
import { Box, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import type { PropertyDetailSidebarProps } from '../types/dashboard-property'
import { PropertyContractParticipants } from './PropertyContractParticipants'

export function PropertyDetailSidebar({ property }: PropertyDetailSidebarProps) {
  const t = useTranslations('properties.detail')

  return (
    <Stack sx={styles.stack} spacing={2.8}>
      {property.apiStatus === 'RENTED' && property.activeContractId ? (
        <PropertyContractParticipants
          propertyId={property.id}
          contractId={property.activeContractId}
        />
      ) : null}

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
