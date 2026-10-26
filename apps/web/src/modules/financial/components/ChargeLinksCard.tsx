import { Box, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { styles } from '../styles/charge-details.styles'
import type { ChargeLinksCardProps } from '../types/charge'
import { ChargeSectionCard } from './ChargeSectionCard'

export function ChargeLinksCard({ charge }: ChargeLinksCardProps) {
  const t = useTranslations('charges.details')
  const empty = t('notAvailable')

  return (
    <ChargeSectionCard title={t('linkingTitle')}>
      <Stack spacing={1.4}>
        <Box>
          <Typography sx={styles.eyebrow}>{t('contract')}</Typography>
          <Typography sx={styles.strong}>{charge.contractCode ?? empty}</Typography>
        </Box>
        <Box>
          <Typography sx={styles.eyebrow}>{t('property')}</Typography>
          <Typography sx={styles.strong}>{charge.property || empty}</Typography>
          <Typography sx={styles.muted}>{charge.propertyAddress ?? empty}</Typography>
        </Box>
        <Box>
          <Typography sx={styles.eyebrow}>{t('tenant')}</Typography>
          <Typography sx={styles.strong}>{charge.payer || empty}</Typography>
          <Typography sx={styles.muted}>{charge.payerEmail ?? empty}</Typography>
        </Box>
      </Stack>
    </ChargeSectionCard>
  )
}
