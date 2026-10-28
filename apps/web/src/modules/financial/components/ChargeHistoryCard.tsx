import { Box, CircularProgress, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { useChargeHistory } from '../hooks/use-financial'
import { useFinancialFormat } from '../hooks/use-financial-format'
import { styles } from '../styles/charge-details.styles'
import type { ChargeHistoryCardProps } from '../types/charge'
import { ChargeReceiptLink } from './ChargeReceiptLink'
import { ChargeSectionCard } from './ChargeSectionCard'

export function ChargeHistoryCard({ chargeId }: ChargeHistoryCardProps) {
  const t = useTranslations('charges.details')
  const fieldLabels = new Map<string, string>(
    (['description', 'type', 'amount', 'dueDate'] as const).map((field) => [
      field,
      t(`history.fields.${field}`),
    ]),
  )
  const format = useFinancialFormat()
  const history = useChargeHistory(chargeId)

  return (
    <ChargeSectionCard title={t('historyTitle')}>
      {history.isPending ? (
        <CircularProgress size={20} />
      ) : !history.data?.length ? (
        <Typography sx={styles.empty}>{t('history.empty')}</Typography>
      ) : (
        <Stack spacing={1.5}>
          {history.data.map((event) => (
            <Stack key={event.id} direction="row" spacing={1.2}>
              <Box sx={styles.historyDot} />
              <Stack spacing={0.3}>
                <Typography sx={styles.historyTitle}>{t(`history.${event.action}`)}</Typography>
                <Typography sx={styles.historyMeta}>
                  {[format.dateTime(event.date), event.actorName ?? t('history.system')].join(
                    ' · ',
                  )}
                </Typography>
                {event.changedFields.length ? (
                  <Typography sx={styles.historyMeta}>
                    {t('history.changed', {
                      fields: event.changedFields
                        .map((field) => fieldLabels.get(field) ?? field)
                        .join(', '),
                    })}
                  </Typography>
                ) : null}
                {event.reason ? (
                  <Typography sx={styles.historyReason}>
                    {t('history.reason', { reason: event.reason })}
                  </Typography>
                ) : null}
                {event.receipt ? (
                  <ChargeReceiptLink chargeId={chargeId} receipt={event.receipt} />
                ) : null}
              </Stack>
            </Stack>
          ))}
        </Stack>
      )}
    </ChargeSectionCard>
  )
}
