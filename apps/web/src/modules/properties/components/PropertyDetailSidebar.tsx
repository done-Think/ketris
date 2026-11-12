import { styles } from '../styles/property-detail-sidebar.styles'
import { Box, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import type { PropertyDetailSidebarProps } from '../types/dashboard-property'
import { PropertyContractParticipants } from './PropertyContractParticipants'
import { PropertyFullHistory } from './PropertyFullHistory'
import { PropertyHistory } from './PropertyHistory'

export function PropertyDetailSidebar({
  property,
  showFullHistory = false,
}: PropertyDetailSidebarProps) {
  const t = useTranslations('properties.detail')
  return (
    <Stack sx={styles.stack} spacing={2.8}>
      {property.apiStatus === 'RENTED' && property.activeContractId ? (
        <PropertyContractParticipants
          propertyId={property.id}
          contractId={property.activeContractId}
        />
      ) : null}

      <Box sx={styles.box}>
        <Typography component="h2" sx={styles.typography}>
          {t('activityTitle')}
        </Typography>
        <Stack spacing={2.8}>
          <PropertyHistory
            key={`activity-${property.id}`}
            propertyId={property.id}
            legacy={property.activityHistory}
            compact
          />
        </Stack>
      </Box>
      {showFullHistory ? (
        <PropertyFullHistory
          key={`full-history-${property.id}`}
          propertyId={property.id}
          legacy={property.activityHistory}
        />
      ) : null}
    </Stack>
  )
}
