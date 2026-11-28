'use client'

import { useId, useState, type UIEvent } from 'react'
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
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded'
import { useFormatter, useTranslations } from 'next-intl'
import type {
  PropertyFullHistoryProps,
  PropertyFullHistoryDialogProps,
  PropertyHistorySummary,
} from '../types/property-history'
import { usePropertyHistory } from '../hooks/use-property-history'
import { propertyHistoryTimeline } from '../utils/property-history-timeline'
import { getActivityDotStyles } from '../styles/property-detail-sidebar.styles'
import { styles } from '../styles/property-full-history.styles'
import { PropertyHistoryEventDetails } from './PropertyHistoryEventDetails'

export function PropertyFullHistory(props: PropertyFullHistoryProps) {
  const t = useTranslations('properties.history')
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button
        variant="outlined"
        color="inherit"
        fullWidth
        sx={styles.button}
        startIcon={<HistoryRoundedIcon sx={styles.icon} />}
        onClick={() => setOpen(true)}
      >
        {t('viewFullHistory')}
      </Button>
      {open ? <PropertyFullHistoryDialog {...props} onClose={() => setOpen(false)} /> : null}
    </>
  )
}

function PropertyFullHistoryDialog({
  propertyId,
  legacy,
  onClose,
}: PropertyFullHistoryDialogProps) {
  const t = useTranslations('properties.history')
  const formatter = useFormatter()
  const titleId = useId()
  const [page, setPage] = useState(1)
  const [activeId, setActiveId] = useState<string | null>(null)
  const history = usePropertyHistory(propertyId, page)
  const events = history.data?.events ?? []
  const selectedId = activeId ?? events[0]?.id
  const date = (value: string) =>
    formatter.dateTime(new Date(value), { dateStyle: 'short', timeStyle: 'short' })
  const label = (event: PropertyHistorySummary) =>
    t('eventTitle', {
      action: t(`actions.${event.action}`),
      name: event.actorName ?? t('system'),
    })
  const timeline = propertyHistoryTimeline({
    events,
    legacy,
    page,
    totalPages: history.data?.pagination.totalPages ?? 0,
    compact: false,
  })
  function focusEvent(id: string) {
    setActiveId(id)
    const target = document.getElementById(`property-history-event-${id}`)
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    target?.focus({ preventScroll: true })
  }
  function trackVisibleEvent(event: UIEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return
    const container = event.currentTarget
    const boundary =
      container.getBoundingClientRect().top + Math.min(80, container.clientHeight * 0.2)
    const cards = container.querySelectorAll<HTMLElement>('article[data-history-event-id]')
    let current: string | undefined
    for (const card of cards) {
      if (card.getBoundingClientRect().top > boundary) break
      current = card.dataset.historyEventId
    }
    setActiveId(current ?? cards[0]?.dataset.historyEventId ?? null)
  }
  return (
    <Dialog
      open
      onClose={onClose}
      fullWidth
      maxWidth="xl"
      scroll="paper"
      aria-labelledby={titleId}
      slotProps={{ paper: { sx: styles.dialog } }}
    >
      <DialogTitle id={titleId}>{t('fullHistory')}</DialogTitle>
      <DialogContent dividers sx={styles.layout} onScroll={trackVisibleEvent}>
        <Box component="section" aria-label={t('allChanges')} sx={styles.changes}>
          <Typography component="h3" variant="h6" sx={styles.heading}>
            {t('allChanges')}
          </Typography>
          {history.isLoading ? <CircularProgress aria-label={t('loading')} size={24} /> : null}
          {history.isError ? (
            <Alert
              severity="warning"
              action={<Button onClick={() => void history.refetch()}>{t('retry')}</Button>}
            >
              {t('loadError')}
            </Alert>
          ) : null}
          {!history.isLoading && !history.isError && !events.length ? (
            <Typography>{t('empty')}</Typography>
          ) : null}
          {events.map((event) => (
            <Box
              component="article"
              id={`property-history-event-${event.id}`}
              data-history-event-id={event.id}
              key={event.id}
              tabIndex={-1}
              aria-labelledby={`${titleId}-${event.id}`}
              sx={event.id === selectedId ? { ...styles.card, ...styles.activeCard } : styles.card}
            >
              <Typography
                id={`${titleId}-${event.id}`}
                component="h4"
                variant="subtitle1"
                fontWeight={600}
              >
                {label(event)}
              </Typography>
              <Typography component="time" dateTime={event.createdAt} sx={styles.date}>
                {date(event.createdAt)}
              </Typography>
              <PropertyHistoryEventDetails
                propertyId={propertyId}
                eventId={event.id}
                showHeading={false}
              />
            </Box>
          ))}
          {history.data && history.data.pagination.totalPages > 1 ? (
            <Pagination
              aria-label={t('pagination')}
              page={page}
              count={history.data.pagination.totalPages}
              onChange={(_, next) => {
                setActiveId(null)
                setPage(next)
              }}
            />
          ) : null}
        </Box>
        <Box component="aside" aria-label={t('timeline')} sx={styles.timeline}>
          <Typography component="h3" variant="h6" sx={styles.heading}>
            {t('timeline')}
          </Typography>
          <Box component="ol" sx={styles.list}>
            {timeline.map((entry) => (
              <Box
                component="li"
                key={
                  entry.kind === 'event'
                    ? entry.event.id
                    : `legacy-${entry.item.label}-${entry.item.date}`
                }
                sx={styles.item}
              >
                <Box component="span" aria-hidden="true" sx={getActivityDotStyles(entry.tone)} />
                {entry.kind === 'event' ? (
                  <ButtonBase
                    sx={styles.timelineButton}
                    aria-current={entry.event.id === selectedId ? 'step' : undefined}
                    onClick={() => focusEvent(entry.event.id)}
                  >
                    <Box component="span" sx={styles.timelineEntry}>
                      <Typography component="span" sx={styles.timelineText}>
                        {label(entry.event)}
                      </Typography>
                      <Typography
                        component="time"
                        dateTime={entry.event.createdAt}
                        sx={styles.date}
                      >
                        {date(entry.event.createdAt)}
                      </Typography>
                    </Box>
                  </ButtonBase>
                ) : (
                  <Box sx={styles.timelineEntry}>
                    <Typography sx={styles.timelineText}>{entry.item.label}</Typography>
                    <Typography sx={styles.date}>
                      {entry.occurredAt ? date(entry.occurredAt) : entry.item.date}
                    </Typography>
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('close')}</Button>
      </DialogActions>
    </Dialog>
  )
}
