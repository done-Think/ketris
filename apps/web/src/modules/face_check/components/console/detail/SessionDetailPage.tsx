'use client'

import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import { Box, Button, Skeleton } from '@mui/material'
import { useFormatter, useLocale, useTranslations } from 'next-intl'
import { defaultLocale, isAppLocale } from '@/i18n/routing'
import { getPathname } from '@/i18n/navigation'

import { ErrorNotice, PageHeader, StatusBadge } from '../../ui'
import type { SessionStatus } from '../../../types'
import { captureProtocol } from '../../../utils/capture-protocol'

import { useSession } from '../../../hooks/use-console-queries'
import type { SessionDetailPageProps } from '../../../types/console.types'
import { detailStyles as styles } from '../../../styles/console.styles'
import { DecisionCard } from './DecisionCard'
import { DocumentCheckCard } from './DocumentCheckCard'
import { EvidenceCard } from './EvidenceCard'
import { SignalsCard } from './SignalsCard'
import { TimelineCard } from './TimelineCard'
import { hasLostFaceCheckAccess } from '../../../utils/query-access'
import { evidenceReviewKey } from '../../../utils/evidence-retention'

const capturableStatuses: SessionStatus[] = ['CREATED', 'IN_PROGRESS', 'RESUBMISSION_REQUESTED']

export function SessionDetailPage({ id }: SessionDetailPageProps) {
  const t = useTranslations('face_check.console.detail')
  const tDocuments = useTranslations('face_check.console.documents')
  const format = useFormatter()
  const currentLocale = useLocale()
  const locale = isAppLocale(currentLocale) ? currentLocale : defaultLocale
  const query = useSession(id)
  const session = hasLostFaceCheckAccess(query.error) ? undefined : query.data
  const backToReview = session?.status === 'REVIEW'
  const captureOpen = session ? capturableStatuses.includes(session.status) : false

  return (
    <>
      <Button
        component="a"
        href={getPathname({
          locale,
          href: {
            pathname: '/dashboard/face_check/sessions',
            query: backToReview ? { filter: 'review' } : undefined,
          },
        })}
        startIcon={<ArrowBackRoundedIcon />}
        sx={styles.back}
      >
        {backToReview ? t('backToReview') : t('backToSessions')}
      </Button>

      {query.isPending ? <Skeleton variant="rounded" height={480} /> : null}
      {query.error ? <ErrorNotice error={query.error} /> : null}

      {session ? (
        <>
          <PageHeader
            title={
              <Box component="span" sx={styles.titleRow}>
                {session.personName}
                <StatusBadge status={session.status} />
              </Box>
            }
            subtitle={t('meta', {
              reference: session.reference ?? t('noReference'),
              document: session.alternativePath
                ? t('alternative')
                : tDocuments(session.documentType ?? session.acceptedDocument),
              created: format.dateTime(new Date(session.createdAt), {
                dateStyle: 'short',
                timeStyle: 'short',
              }),
              used: session.attemptsUsed,
              max: session.maxAttempts,
              protocol: captureProtocol(session.token),
            })}
            actions={
              captureOpen ? (
                <Button
                  variant="outlined"
                  color="secondary"
                  component="a"
                  href={getPathname({
                    locale,
                    href: {
                      pathname: '/face_check/verify/[token]',
                      params: { token: session.token },
                    },
                  })}
                  target="_blank"
                  rel="noopener"
                  startIcon={<OpenInNewRoundedIcon />}
                >
                  {t('openCapture')}
                </Button>
              ) : null
            }
          />
          <Box sx={styles.columns}>
            <Box sx={styles.column}>
              <EvidenceCard key={evidenceReviewKey(session)} session={session} />
              <SignalsCard session={session} />
              <DocumentCheckCard session={session} />
            </Box>
            <Box sx={styles.column}>
              <DecisionCard session={session} />
              <TimelineCard session={session} />
            </Box>
          </Box>
        </>
      ) : null}
    </>
  )
}
