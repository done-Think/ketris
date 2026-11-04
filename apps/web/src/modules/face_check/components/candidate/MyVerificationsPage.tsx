'use client'

import { Alert, Box, Button, Paper, Skeleton, Typography } from '@mui/material'
import { useFormatter, useTranslations } from 'next-intl'
import { useTenantSessionScope } from '@shared/hooks/use-tenant-session-scope'
import { useCandidateVerifications } from '../../hooks/use-candidate-verifications'
import { myVerificationsStyles as styles } from '../../styles/my-verifications.styles'
import { hasLostFaceCheckAccess } from '../../utils/query-access'
import { ErrorNotice, PageHeader, StatusBadge } from '../ui'

export function MyVerificationsPage() {
  const t = useTranslations('face_check.candidate')
  const format = useFormatter()
  const scope = useTenantSessionScope()
  const query = useCandidateVerifications()
  const data = hasLostFaceCheckAccess(query.error) ? undefined : query.data

  return (
    <Box
      key={`${scope.tenantId}:${scope.userId}:${scope.role}`}
      sx={styles.root}
      data-face-check-private="true"
      className="sentry-block"
    >
      <PageHeader title={t('title')} subtitle={t('subtitle')} />
      {query.isPending ? <Skeleton variant="rounded" height={180} /> : null}
      {query.error ? <ErrorNotice error={query.error} /> : null}
      {data?.items.length === 0 ? <Alert severity="info">{t('empty')}</Alert> : null}
      {data?.items.map((item) => (
        <Paper key={item.id} component="article" elevation={0} sx={styles.card}>
          <Box sx={styles.heading}>
            <Typography component="h2" variant="h6">
              {item.propertyTitle}
            </Typography>
            <StatusBadge status={item.status} />
          </Box>
          <Typography sx={styles.meta}>{t('requestedBy', { name: item.agencyName })}</Typography>
          {item.captureUrl &&
          ['CREATED', 'IN_PROGRESS', 'RESUBMISSION_REQUESTED'].includes(item.status) ? (
            <>
              <Typography>{t('pending')}</Typography>
              <Typography sx={styles.meta}>
                {t('expiresAt', {
                  date: format.dateTime(new Date(item.expiresAt), {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  }),
                })}
              </Typography>
              <Button component="a" variant="contained" href={item.captureUrl} sx={styles.action}>
                {t(item.status === 'CREATED' ? 'start' : 'continue')}
              </Button>
            </>
          ) : (
            <Typography>
              {t(
                item.status === 'EXPIRED'
                  ? 'expired'
                  : ['APPROVED', 'REJECTED', 'ABANDONED'].includes(item.status)
                    ? 'finished'
                    : ['REVIEW', 'SUBMITTED', 'PROCESSING'].includes(item.status)
                      ? 'processing'
                      : 'unavailable',
              )}
            </Typography>
          )}
        </Paper>
      ))}
    </Box>
  )
}
