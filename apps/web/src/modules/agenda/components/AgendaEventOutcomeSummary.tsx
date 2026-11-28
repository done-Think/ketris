import { Box, Stack, Typography } from '@mui/material'
import { useFormatter, useTranslations } from 'next-intl'

import { agendaDisplayStatusIcons, agendaDisplayStatusTones } from '../config/agenda-event-status'
import { agendaEventToneStyles } from '../styles/agenda-calendar.styles'
import { styles } from '../styles/agenda-event-outcome-summary.styles'
import type { AgendaEventOutcomeSummaryProps } from '../types/agenda-event'

export function AgendaEventOutcomeSummary({ event }: AgendaEventOutcomeSummaryProps) {
  const t = useTranslations('agenda.eventDetail')
  const formatter = useFormatter()
  if (event.status !== 'COMPLETED' && event.status !== 'NO_SHOW') return null

  const tone = agendaEventToneStyles[agendaDisplayStatusTones[event.status]]
  const Icon = agendaDisplayStatusIcons[event.status]

  return (
    <Box sx={styles.box(tone)}>
      <Stack direction="row" spacing={1} alignItems="center">
        {Icon ? <Icon sx={styles.icon(tone)} /> : null}
        <Typography sx={styles.title(tone)}>{t(`outcomeSummary.${event.status}`)}</Typography>
      </Stack>
      {event.outcomeRecordedBy && event.outcomeRecordedAt ? (
        <Typography sx={styles.meta}>
          {t('outcomeSummary.recordedBy', {
            name: event.outcomeRecordedBy,
            date: formatter.dateTime(new Date(event.outcomeRecordedAt), {
              day: 'numeric',
              month: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }),
          })}
        </Typography>
      ) : null}
      {event.visitInterest || event.outcomeNotes ? (
        <Box component="dl" sx={styles.details}>
          {event.visitInterest ? (
            <>
              <Typography component="dt" sx={styles.label}>
                {t('outcomeSummary.interest')}
              </Typography>
              <Typography component="dd" sx={styles.value}>
                {t(`visitInterests.${event.visitInterest}`)}
              </Typography>
            </>
          ) : null}
          {event.outcomeNotes ? (
            <>
              <Typography component="dt" sx={styles.label}>
                {t('outcomeSummary.notes')}
              </Typography>
              <Typography component="dd" sx={styles.value}>
                {event.outcomeNotes}
              </Typography>
            </>
          ) : null}
        </Box>
      ) : null}
    </Box>
  )
}
