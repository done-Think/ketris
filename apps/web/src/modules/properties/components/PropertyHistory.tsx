'use client'

import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  ButtonBase,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Pagination,
  Typography,
} from '@mui/material'
import { useFormatter, useTranslations } from 'next-intl'
import { usePropertyHistory } from '../hooks/use-property-history'
import type { PropertyHistoryProps } from '../types/property-history'
import { styles } from '../styles/property-history.styles'
import { PropertyHistoryEventDetails } from './PropertyHistoryEventDetails'
import { propertyHistoryTimeline } from '../utils/property-history-timeline'
import { getActivityDotStyles } from '../styles/property-detail-sidebar.styles'

export function PropertyHistory({ propertyId, compact = false, legacy }: PropertyHistoryProps) {
  const t = useTranslations('properties.history')
  const formatter = useFormatter()
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<string | null>(null)
  const history = usePropertyHistory(propertyId, page)
  const items = history.isLoading
    ? []
    : propertyHistoryTimeline({
        events: history.data?.events ?? [],
        legacy,
        page,
        totalPages: history.data?.pagination.totalPages ?? 0,
        compact,
      })
  const date = (value: string) =>
    formatter.dateTime(new Date(value), { dateStyle: 'short', timeStyle: 'short' })
  return (
    <>
      {history.isLoading ? <CircularProgress size={24} aria-label={t('loading')} /> : null}
      {history.isError ? (
        <Alert
          severity="warning"
          action={<Button onClick={() => void history.refetch()}>{t('retry')}</Button>}
        >
          {t('loadError')}
        </Alert>
      ) : null}
      <Box component="ul" sx={styles.events}>
        {items.map((entry) => (
          <Box
            component="li"
            sx={styles.row}
            key={
              entry.kind === 'event'
                ? entry.event.id
                : `legacy-${entry.item.label}-${entry.item.date}`
            }
          >
            <Box component="span" aria-hidden="true" sx={getActivityDotStyles(entry.tone)} />
            {entry.kind === 'event' && compact ? (
              <Box component="span" sx={styles.entry}>
                <Typography component="span" sx={styles.entryText}>
                  {t('eventTitle', {
                    action: t(`actions.${entry.event.action}`),
                    name: entry.event.actorName ?? t('system'),
                  })}
                </Typography>
                <Typography component="time" dateTime={entry.event.createdAt} sx={styles.entryDate}>
                  {date(entry.event.createdAt)}
                </Typography>
              </Box>
            ) : entry.kind === 'event' ? (
              <ButtonBase sx={styles.event} onClick={() => setSelected(entry.event.id)}>
                <Box component="span" sx={styles.entry}>
                  <Typography component="span" sx={styles.entryText}>
                    {t('eventTitle', {
                      action: t(`actions.${entry.event.action}`),
                      name: entry.event.actorName ?? t('system'),
                    })}
                  </Typography>
                  <Typography
                    component="time"
                    dateTime={entry.event.createdAt}
                    sx={styles.entryDate}
                  >
                    {date(entry.event.createdAt)}
                  </Typography>
                </Box>
              </ButtonBase>
            ) : (
              <Box component="span" sx={styles.entry}>
                <Typography component="span" sx={styles.entryText}>
                  {entry.item.label}
                </Typography>
                <Typography component="span" sx={styles.entryDate}>
                  {entry.occurredAt ? date(entry.occurredAt) : entry.item.date}
                </Typography>
              </Box>
            )}
          </Box>
        ))}
      </Box>
      {!compact && history.data && history.data.pagination.totalPages > 1 ? (
        <Pagination
          page={page}
          count={history.data.pagination.totalPages}
          onChange={(_, next) => setPage(next)}
          aria-label={t('pagination')}
          sx={styles.pagination}
        />
      ) : null}
      {!history.isLoading && !history.isError && !items.length ? (
        <Typography color="text.secondary">{t('empty')}</Typography>
      ) : null}
      <Dialog
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        fullWidth
        maxWidth="md"
        aria-labelledby={`property-history-title-${compact ? 'compact' : 'full'}`}
      >
        <DialogTitle id={`property-history-title-${compact ? 'compact' : 'full'}`}>
          {t('details')}
        </DialogTitle>
        <DialogContent>
          {selected ? (
            <PropertyHistoryEventDetails
              key={selected}
              propertyId={propertyId}
              eventId={selected}
            />
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelected(null)}>{t('close')}</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
