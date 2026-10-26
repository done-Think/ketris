import HomeWorkOutlinedIcon from '@mui/icons-material/HomeWorkOutlined'
import { Alert, Box, Button, Paper, Skeleton, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useCrmFormatter } from '../../hooks/use-crm-formatter'
import * as crmStyles from '../../styles/opportunity-property-panel.styles'

import type { OpportunityPropertyPanelProps } from '../../types/opportunity-detail'

export function OpportunityPropertyPanel({
  opportunity,
  property,
  propertyLocation,
  isLoading,
  isError,
  onRetry,
}: OpportunityPropertyPanelProps) {
  const format = useCrmFormatter()
  const t = useTranslations('crm.opportunityDetail.propertyPanel')

  return (
    <Paper component="section" elevation={0} sx={crmStyles.paperSx}>
      <Typography component="h2" sx={crmStyles.typographySx}>
        {t('title')}
      </Typography>
      {isLoading ? (
        <Stack direction="row" spacing={2}>
          <Skeleton variant="rounded" width={108} height={82} />
          <Box flex={1}>
            <Skeleton width="60%" />
            <Skeleton width="42%" />
            <Skeleton width="30%" />
          </Box>
        </Stack>
      ) : isError || !property ? (
        <Alert severity="warning" action={<Button onClick={onRetry}>{t('retry')}</Button>}>
          {t('loadError', { id: opportunity.propertyId })}
        </Alert>
      ) : (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.8} sx={crmStyles.stackSx}>
          {property.coverUrl ? (
            <Box
              component="img"
              src={property.coverUrl}
              alt={property.title}
              sx={crmStyles.boxSx}
            />
          ) : (
            <Box sx={crmStyles.boxSx2}>
              <HomeWorkOutlinedIcon />
            </Box>
          )}
          <Stack alignItems="flex-start" spacing={0.6} minWidth={0} flex={1}>
            <Box minWidth={0}>
              <Typography sx={crmStyles.typographySx2}>{property.title}</Typography>
              <Typography color="text.secondary" sx={crmStyles.typographySx3}>
                {[
                  property.propertyType,
                  property.area ? `${property.area} m²` : null,
                  propertyLocation,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </Typography>
            </Box>
            <Typography sx={crmStyles.typographySx4}>
              {format.money(property.price)}
              {property.purpose === 'ALUGUEL' ? t('monthlySuffix') : ''}
            </Typography>
          </Stack>
        </Stack>
      )}
    </Paper>
  )
}
