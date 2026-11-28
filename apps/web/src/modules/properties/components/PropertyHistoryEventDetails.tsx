import { Alert, Box, Button, CircularProgress, Typography } from '@mui/material'
import { useFormatter, useTranslations } from 'next-intl'
import { usePropertyHistoryEvent } from '../hooks/use-property-history'
import type { PropertyHistoryEventDetailsProps } from '../types/property-history'
import { propertyHistoryFieldKeys } from '../config/property-history-fields'
import { styles } from '../styles/property-history.styles'
import { PropertyHistoryValue } from './PropertyHistoryValue'

export function PropertyHistoryEventDetails({
  propertyId,
  eventId,
  showHeading = true,
}: PropertyHistoryEventDetailsProps) {
  const t = useTranslations('properties.history')
  const formatter = useFormatter()
  const detail = usePropertyHistoryEvent(propertyId, eventId)
  const event = detail.data?.id === eventId ? detail.data : undefined
  return (
    <>
      {detail.isLoading ? <CircularProgress aria-label={t('loading')} size={24} /> : null}
      {detail.isError ? (
        <Alert
          severity="warning"
          action={<Button onClick={() => void detail.refetch()}>{t('retry')}</Button>}
        >
          {t('loadError')}
        </Alert>
      ) : null}
      {event ? (
        <>
          {showHeading ? (
            <>
              <Typography fontWeight={600}>{t(`actions.${event.action}`)}</Typography>
              <Typography sx={styles.metadata}>
                {event.actorName ?? t('system')} ·{' '}
                {formatter.dateTime(new Date(event.createdAt), {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })}
              </Typography>
              <Typography variant="subtitle2" sx={styles.eventChanges}>
                {t('eventChanges')}
              </Typography>
            </>
          ) : null}
          {event.changes.map((change) => (
            <Box key={change.field} sx={styles.change}>
              <Typography fontWeight={600}>
                {t(`fields.${propertyHistoryFieldKeys[change.field]}`)}
              </Typography>
              <Box sx={styles.columns}>
                {(['before', 'after'] as const).map((side) => (
                  <Box key={side}>
                    <Typography
                      component="span"
                      sx={[
                        styles.comparisonLabel,
                        side === 'before' ? styles.beforeLabel : styles.afterLabel,
                      ]}
                    >
                      {t(side)}
                    </Typography>
                    <PropertyHistoryValue field={change.field} value={change[side]} />
                  </Box>
                ))}
              </Box>
            </Box>
          ))}
        </>
      ) : null}
    </>
  )
}
