'use client'

import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import { Box, Button, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { ErrorNotice } from '../../ui'
import type { VerificationSession } from '../../../types'

import { useRecordEvidenceView } from '../../../hooks/use-console-mutations'
import type { SessionCardProps } from '../../../types/console.types'
import { cardStyles } from '../../../styles/console.styles'
import { CapturedEvidence } from './CapturedEvidence'
import { areEvidenceImagesDeleted } from '../../../utils/evidence-retention'

function emptyMessageKey(session: VerificationSession) {
  if (session.alternativePath) return 'alternative'

  return 'empty'
}

export function EvidenceCard({ session }: SessionCardProps) {
  const t = useTranslations('face_check.console.detail.evidence')
  const reveal = useRecordEvidenceView(session.id)
  const revealed = reveal.isSuccess
  const deleted = areEvidenceImagesDeleted(session)
  const hasEvidence = (session.evidenceHistory?.length ?? 0) > 0 || session.evidence.length > 0

  return (
    <Box component="section" aria-labelledby="evidence-title" sx={cardStyles.card}>
      <Box sx={cardStyles.header}>
        <Typography id="evidence-title" component="h2" sx={cardStyles.title}>
          {t('title')}
        </Typography>
        {hasEvidence && !deleted && !revealed ? (
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<VisibilityOutlinedIcon />}
            disabled={reveal.isPending}
            onClick={() => reveal.mutate()}
          >
            {t('reveal')}
          </Button>
        ) : null}
        {hasEvidence && !deleted && revealed ? (
          <Typography sx={cardStyles.caption}>{t('revealedNotice')}</Typography>
        ) : null}
      </Box>

      <Typography sx={cardStyles.caption}>{t('retentionNotice')}</Typography>
      {deleted ? (
        <Typography role="status" sx={cardStyles.empty}>
          {t('deleted')}
        </Typography>
      ) : hasEvidence ? (
        <CapturedEvidence session={session} revealed={revealed} />
      ) : (
        <Typography sx={cardStyles.empty}>{t(emptyMessageKey(session))}</Typography>
      )}
      {reveal.error ? <ErrorNotice error={reveal.error} /> : null}
    </Box>
  )
}
