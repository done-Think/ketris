'use client'

import AddRoundedIcon from '@mui/icons-material/AddRounded'
import { Alert, Box, Button, Skeleton } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { ErrorNotice, PageHeader } from '../../ui'

import { hasLostFaceCheckAccess } from '../../../utils/query-access'

import { useOverview } from '../../../hooks/use-console-queries'
import { overviewStyles } from '../../../styles/console.styles'
import { NewVerificationDialog } from '../new-verification/NewVerificationDialog'
import { KpiGrid } from './KpiGrid'
import { ReviewQueueCard } from './ReviewQueueCard'
import { SessionsByDayCard } from './SessionsByDayCard'

export function OverviewPage() {
  const t = useTranslations('face_check.console.overview')
  const overview = useOverview('real')
  const data = hasLostFaceCheckAccess(overview.error) ? undefined : overview.data
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <>
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        actions={
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={() => setDialogOpen(true)}
          >
            {t('newVerification')}
          </Button>
        }
      />
      <Alert severity="warning">{t('pilotWarning')}</Alert>
      {overview.isPending ? <Skeleton variant="rounded" height={420} /> : null}
      {overview.error ? <ErrorNotice error={overview.error} /> : null}
      {data ? (
        <>
          <KpiGrid overview={data} />
          <Box sx={overviewStyles.columns}>
            <SessionsByDayCard overview={data} />
            <ReviewQueueCard overview={data} />
          </Box>
        </>
      ) : null}

      <NewVerificationDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </>
  )
}
