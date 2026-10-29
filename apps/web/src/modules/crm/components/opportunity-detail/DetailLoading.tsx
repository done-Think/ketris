import { Box, Skeleton, Stack } from '@mui/material'
import { useTranslations } from 'next-intl'
import * as crmStyles from '../../styles/detail-loading.styles'

export function DetailLoading() {
  const t = useTranslations('crm.opportunityDetail')
  return (
    <Box sx={crmStyles.boxSx} aria-label={t('loadingAriaLabel')}>
      <Skeleton width={180} height={24} />
      <Stack direction="row" justifyContent="space-between" sx={crmStyles.stackSx}>
        <Skeleton width="42%" height={48} />
        <Skeleton width={150} height={48} />
      </Stack>
      <Box sx={crmStyles.boxSx2}>
        <Skeleton variant="rounded" height={310} />
        <Skeleton variant="rounded" height={310} />
      </Box>
    </Box>
  )
}
