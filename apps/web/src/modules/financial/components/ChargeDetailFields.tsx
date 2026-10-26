import { Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { useFinancialFormat } from '../hooks/use-financial-format'
import { styles } from '../styles/charge-details.styles'
import type { ChargeDetailFieldsProps } from '../types/charge'
import { ChargeSectionCard } from './ChargeSectionCard'

export function ChargeDetailFields({ charge }: ChargeDetailFieldsProps) {
  const t = useTranslations('charges.details')
  const format = useFinancialFormat()
  const fields: Array<[string, string]> = [
    [t('fields.type'), t(`directions.${charge.direction}`)],
    [t('fields.description'), charge.description ?? t('notAvailable')],
    [t('fields.competence'), format.month(charge.competence)],
    [t('fields.amount'), format.currency(charge.amount)],
    [t('fields.dueDate'), format.date(charge.dueDate)],
    [t('fields.payment'), charge.payment ? format.date(charge.payment.date) : t('notPaid')],
    [t('fields.method'), charge.payment?.method || t('notAvailable')],
    ...(charge.cancellation
      ? ([
          [
            t('fields.cancelledAt'),
            charge.cancellation.date
              ? format.dateTime(charge.cancellation.date)
              : t('notAvailable'),
          ],
          [t('fields.cancellationReason'), charge.cancellation.reason ?? t('notAvailable')],
        ] as Array<[string, string]>)
      : []),
  ]

  return (
    <ChargeSectionCard title={t('detailsTitle')}>
      <Stack spacing={1.35}>
        {fields.map(([label, value]) => (
          <Stack
            key={label}
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            spacing={0.35}
          >
            <Typography sx={styles.fieldLabel}>{label}</Typography>
            <Typography sx={styles.fieldValue}>{value}</Typography>
          </Stack>
        ))}
      </Stack>
    </ChargeSectionCard>
  )
}
