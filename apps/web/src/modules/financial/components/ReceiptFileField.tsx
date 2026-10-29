import AttachFileRoundedIcon from '@mui/icons-material/AttachFileRounded'
import { Box, Button, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { type ChangeEvent, useId } from 'react'

import { RECEIPT_ACCEPT } from '../config/receipt-limits'
import { styles } from '../styles/receipt-file-field.styles'
import type { ReceiptFileFieldProps } from '../types/charge'

export function ReceiptFileField({ file, error, onChange }: ReceiptFileFieldProps) {
  const t = useTranslations('charges.paymentDialog')
  const inputId = useId()

  return (
    <Box sx={styles.container}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2} alignItems={{ sm: 'center' }}>
        <Button
          component="label"
          htmlFor={inputId}
          variant="outlined"
          color="secondary"
          startIcon={<AttachFileRoundedIcon />}
        >
          {t(file ? 'replaceReceipt' : 'attachReceipt')}
        </Button>
        <Stack spacing={0.3}>
          <Typography sx={styles.name}>{file?.name ?? t('noReceiptSelected')}</Typography>
          <Typography sx={styles.hint}>{t('receiptHint')}</Typography>
          {error ? <Typography sx={styles.error}>{error}</Typography> : null}
        </Stack>
        {file ? (
          <Button color="secondary" onClick={() => onChange(null)}>
            {t('removeReceipt')}
          </Button>
        ) : null}
      </Stack>
      <Box
        component="input"
        id={inputId}
        type="file"
        accept={RECEIPT_ACCEPT}
        aria-label={t('attachReceipt')}
        sx={styles.hiddenInput}
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          onChange(event.target.files?.[0] ?? null)
          event.target.value = ''
        }}
      />
    </Box>
  )
}
