import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import { Box, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { useFinancialFormat } from '../hooks/use-financial-format'
import { styles } from '../styles/charge-details.styles'
import type { ChargeReceiptCardProps } from '../types/charge'
import { ChargeReceiptLink } from './ChargeReceiptLink'
import { ChargeSectionCard } from './ChargeSectionCard'

export function ChargeReceiptCard({ charge }: ChargeReceiptCardProps) {
  const t = useTranslations('charges.details')
  const format = useFinancialFormat()
  const receipt = charge.receipt

  return (
    <ChargeSectionCard title={t('receiptTitle')}>
      {receipt ? (
        <Stack direction="row" spacing={1.6} alignItems="center">
          <Box sx={styles.receiptIcon}>
            <DescriptionOutlinedIcon color="action" />
          </Box>
          <Stack sx={styles.titleRow}>
            <Typography sx={styles.strong}>{receipt.name}</Typography>
            <Typography sx={styles.muted}>
              {t('receiptMeta', {
                date: format.dateTime(receipt.uploadedAt),
                size: format.fileSize(receipt.size),
              })}
            </Typography>
            <ChargeReceiptLink chargeId={charge.id} receipt={receipt} />
          </Stack>
        </Stack>
      ) : (
        <Typography sx={styles.empty}>{t('noReceipt')}</Typography>
      )}
    </ChargeSectionCard>
  )
}
