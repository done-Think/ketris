'use client'

import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import { Box, Chip, Typography } from '@mui/material'
import { useFormatter, useTranslations } from 'next-intl'

import { EvidenceImage } from './EvidenceImage'
import type { EvidenceGridProps } from '../../../types/console.types'
import { cardStyles, detailStyles as styles } from '../../../styles/console.styles'
import { EvidenceDiagnostics } from './EvidenceDiagnostics'

function LatestEvidence({ session, revealed }: EvidenceGridProps) {
  const t = useTranslations('face_check.console.detail.evidence')

  return (
    <Box sx={styles.evidenceGrid}>
      {session.evidence.map((kind) => (
        <Box component="figure" key={kind} sx={styles.figure}>
          <Box sx={styles.evidenceFrame(true)}>
            {revealed ? (
              <EvidenceImage sessionId={session.id} reference={kind} label={t(`labels.${kind}`)} />
            ) : (
              <Box sx={styles.evidenceLocked} role="img" aria-label={t('locked')}>
                <LockOutlinedIcon />
              </Box>
            )}
          </Box>
          <Box component="figcaption" sx={styles.evidenceCaption}>
            <span>{t(`labels.${kind}`)}</span>
          </Box>
        </Box>
      ))}
    </Box>
  )
}

export function CapturedEvidence({ session, revealed }: EvidenceGridProps) {
  const t = useTranslations('face_check.console.detail.evidence')
  const tIssues = useTranslations('face_check.capture.live.issues')
  const format = useFormatter()
  const history = session.evidenceHistory ?? []
  const attempts = [...new Set(history.map((item) => item.attempt))]
  if (!history.length) return <LatestEvidence session={session} revealed={revealed} />

  return (
    <Box sx={styles.evidenceHistory}>
      {attempts.map((attempt) => (
        <Box component="section" key={attempt} sx={styles.evidenceAttempt}>
          <Typography component="h3" sx={cardStyles.title}>
            {t('attempt', { attempt })}
          </Typography>
          <Box sx={styles.evidenceGrid}>
            {history
              .filter((item) => item.attempt === attempt)
              .map((item, index) => {
                const label = item.challenge
                  ? t(`movements.${item.challenge}`)
                  : t(`labels.${item.step}`)
                return (
                  <Box component="figure" key={item.id} sx={styles.figure}>
                    <Box sx={styles.evidenceFrame(true)}>
                      {revealed ? (
                        <EvidenceImage
                          sessionId={session.id}
                          reference={item.id}
                          label={t('openPhoto', { label })}
                        />
                      ) : (
                        <Box sx={styles.evidenceLocked} role="img" aria-label={t('locked')}>
                          <LockOutlinedIcon />
                        </Box>
                      )}
                    </Box>
                    <Box component="figcaption" sx={styles.captureCaption}>
                      <Typography component="span" sx={styles.signalLabel}>
                        {t('photo', { number: index + 1, label })}
                      </Typography>
                      <span>
                        {format.dateTime(new Date(item.capturedAt), {
                          dateStyle: 'short',
                          timeStyle: 'medium',
                        })}
                      </span>
                      <Chip
                        size="small"
                        label={t(`statuses.${item.status}`)}
                        sx={styles.checkResult(
                          item.status === 'accepted'
                            ? true
                            : item.status === 'rejected'
                              ? false
                              : null,
                        )}
                      />
                      {item.reason ? <span>{tIssues(item.reason)}</span> : null}
                      <EvidenceDiagnostics evidence={item} />
                    </Box>
                  </Box>
                )
              })}
          </Box>
        </Box>
      ))}
    </Box>
  )
}
