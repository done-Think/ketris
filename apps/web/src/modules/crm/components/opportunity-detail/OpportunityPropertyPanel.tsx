import HomeWorkOutlinedIcon from '@mui/icons-material/HomeWorkOutlined'
import { Alert, Box, Button, Paper, Skeleton, Stack, Typography } from '@mui/material'
import { useLocale, useTranslations } from 'next-intl'
import type { AppLocale } from '@/i18n/types/locale.types'

import { brand, radius, surface } from '@shared/theme/tokens'

import type { OpportunityPropertyPanelProps } from '../../types/opportunity-detail'
import { formatCurrency } from '../../utils/formatters'
import { panelSx } from './opportunity-detail.styles'

export function OpportunityPropertyPanel({
  opportunity,
  property,
  propertyLocation,
  isLoading,
  isError,
  onRetry,
}: OpportunityPropertyPanelProps) {
  const locale = useLocale() as AppLocale
  const t = useTranslations('crm.opportunityDetail.propertyPanel')

  return (
    <Paper component="section" elevation={0} sx={{ ...panelSx, p: { xs: 2, md: 2.5 } }}>
      <Typography
        component="h2"
        sx={{ mb: 1.35, fontSize: 16, fontWeight: 800, textAlign: 'center' }}
      >
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
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.8}
          sx={{ p: 1.2, bgcolor: surface.app, borderRadius: `${radius.sm}px` }}
        >
          {property.coverUrl ? (
            <Box
              component="img"
              src={property.coverUrl}
              alt={property.title}
              sx={{
                width: { xs: '100%', sm: 112 },
                height: { xs: 150, sm: 82 },
                objectFit: 'cover',
                borderRadius: `${radius.sm}px`,
              }}
            />
          ) : (
            <Box
              sx={{
                display: 'grid',
                placeItems: 'center',
                width: { xs: '100%', sm: 112 },
                height: { xs: 110, sm: 82 },
                flexShrink: 0,
                borderRadius: `${radius.sm}px`,
                bgcolor: brand.neutral[100],
                color: 'text.disabled',
              }}
            >
              <HomeWorkOutlinedIcon />
            </Box>
          )}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems="flex-start"
            justifyContent="space-between"
            spacing={1.2}
            minWidth={0}
            flex={1}
          >
            <Box minWidth={0}>
              <Typography sx={{ fontSize: 14, fontWeight: 800 }}>{property.title}</Typography>
              <Typography color="text.secondary" sx={{ mt: 0.2, fontSize: 11.5 }}>
                {[
                  property.propertyType,
                  property.area ? `${property.area} m²` : null,
                  propertyLocation,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </Typography>
            </Box>
            <Typography
              sx={{
                color: 'primary.main',
                fontSize: 18,
                fontWeight: 900,
                flexShrink: 0,
                textAlign: { xs: 'left', sm: 'right' },
              }}
            >
              {formatCurrency(property.price, locale)}
              {property.purpose === 'ALUGUEL' ? t('monthlySuffix') : ''}
            </Typography>
          </Stack>
        </Stack>
      )}
    </Paper>
  )
}
