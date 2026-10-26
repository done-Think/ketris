import { Button } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useSnackbar } from 'notistack'

import { useDownloadChargeReceipt } from '../hooks/use-financial'
import { useFinancialError } from '../hooks/use-financial-error'
import { styles } from '../styles/charge-details.styles'
import type { ChargeReceiptLinkProps } from '../types/charge'

export function ChargeReceiptLink({ chargeId, receipt }: ChargeReceiptLinkProps) {
  const t = useTranslations('charges.details')
  const { enqueueSnackbar } = useSnackbar()
  const errorMessage = useFinancialError()
  const download = useDownloadChargeReceipt(chargeId)

  return (
    <Button
      onClick={() =>
        download.mutate(receipt.id, {
          onError: (error) =>
            enqueueSnackbar(errorMessage(error, 'downloadFailed'), { variant: 'error' }),
        })
      }
      disabled={download.isPending}
      sx={styles.linkButton}
    >
      {t('downloadReceipt', { name: receipt.name })}
    </Button>
  )
}
