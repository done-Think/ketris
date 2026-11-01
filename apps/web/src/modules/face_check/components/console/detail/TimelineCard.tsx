'use client'

import { Box, Typography } from '@mui/material'
import { useFormatter, useTranslations } from 'next-intl'

import { brand, statusPalette } from '../../../styles/tokens'
import type { TimelineEvent } from '../../../types'

const alternativeReasons = ['noCamera', 'accessibility', 'noConsent', 'other'] as const
const decisionReasons = ['match', 'mismatch', 'illegible', 'tampered', 'liveness'] as const

import { useActorLabel } from '../../../hooks/use-actor-label'
import type { SessionCardProps } from '../../../types/console.types'
import { cardStyles, detailStyles as styles } from '../../../styles/console.styles'

function dotColor(event: TimelineEvent) {
  if (event.kind === 'autoApproved' || event.decision === 'approve')
    return statusPalette.success.dot
  if (event.kind === 'autoReview' || event.kind === 'alternativeRequested')
    return statusPalette.warning.dot
  if (event.kind === 'autoRedo' || event.decision === 'redo') return statusPalette.redo.dot
  if (event.decision === 'reject') return statusPalette.error.dot
  if (event.kind === 'evidenceViewed') return brand.graphite[400]
  if (event.kind === 'created' || event.kind === 'expired') return statusPalette.neutral.dot

  return statusPalette.info.dot
}

export function TimelineCard({ session }: SessionCardProps) {
  const t = useTranslations('face_check.console.detail.timeline')
  const tDecision = useTranslations('face_check.console.detail.decision')
  const tAlternative = useTranslations('face_check.console.detail.timeline.alternativeReasons')
  const actorLabel = useActorLabel(session)
  const format = useFormatter()

  return (
    <Box component="section" aria-labelledby="timeline-title" sx={cardStyles.card}>
      <Typography id="timeline-title" component="h2" sx={cardStyles.title}>
        {t('title')}
      </Typography>
      <Box component="ol" sx={styles.timeline}>
        {session.timeline.map((event) => {
          const alternativeReason = alternativeReasons.find((reason) => reason === event.reason)
          const decisionReason = decisionReasons.find((reason) => reason === event.reason)
          const reason =
            event.kind === 'alternativeRequested'
              ? alternativeReason
                ? tAlternative(alternativeReason)
                : undefined
              : decisionReason
                ? tDecision(`reasons.${decisionReason}`)
                : undefined
          return (
            <Box component="li" key={event.id} sx={styles.timelineItem}>
              <Box component="span" sx={styles.timelineDot(dotColor(event))} />
              <Box>
                <Typography sx={styles.timelineLabel}>
                  {event.kind === 'decision' && event.decision
                    ? t('decision', { decision: tDecision(`choices.${event.decision}.done`) })
                    : t(`events.${event.kind}`)}
                </Typography>
                <Typography sx={styles.timelineActor}>{actorLabel(event.actor)}</Typography>
                {reason ? (
                  <Typography sx={styles.timelineActor}>{t('reason', { reason })}</Typography>
                ) : null}
                {event.note ? (
                  <Typography sx={styles.timelineActor}>
                    {t('note', { note: event.note })}
                  </Typography>
                ) : null}
                {event.manualOverride ? (
                  <Typography sx={styles.timelineActor}>{t('manualOverride')}</Typography>
                ) : null}
                {event.consent ? (
                  <Typography sx={styles.timelineActor}>
                    {t('consentTerms', { version: event.consent.termsVersion })}
                  </Typography>
                ) : null}
              </Box>
              <Typography sx={styles.timelineTime}>
                {format.dateTime(new Date(event.at), { dateStyle: 'short', timeStyle: 'short' })}
              </Typography>
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}
