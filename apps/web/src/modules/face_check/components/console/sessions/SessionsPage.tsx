'use client'

import AddRoundedIcon from '@mui/icons-material/AddRounded'
import { Button, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { useRouter } from '@/i18n/navigation'
import { useState } from 'react'

import { ErrorNotice, PageHeader } from '../../ui'

import { hasLostFaceCheckAccess } from '../../../utils/query-access'

import { useSessionList } from '../../../hooks/use-console-queries'
import type { SessionListParams } from '../../../types/console.types'
import {
  parseSessionListParams,
  serializeSessionListParams,
  sessionsPageSize,
} from '../../../utils/session-list-params'
import { sessionsStyles } from '../../../styles/console.styles'
import { NewVerificationDialog } from '../new-verification/NewVerificationDialog'
import { SessionsFilters } from './SessionsFilters'
import { SessionsGrid } from './SessionsGrid'

export function SessionsPage() {
  const t = useTranslations('face_check.console.sessions')
  const router = useRouter()
  const searchParams = useSearchParams()
  const params = parseSessionListParams(searchParams)
  const [dialogOpen, setDialogOpen] = useState(false)
  const list = useSessionList({ ...params, pageSize: sessionsPageSize })
  const data = hasLostFaceCheckAccess(list.error) ? undefined : list.data
  const isReview = params.filter === 'review'

  const update = (next: Partial<SessionListParams>) =>
    router.replace(
      {
        pathname: '/dashboard/face_check/sessions',
        query: Object.fromEntries(
          new URLSearchParams(serializeSessionListParams({ ...params, ...next })),
        ),
      },
      {
        scroll: false,
      },
    )

  return (
    <>
      <PageHeader
        title={isReview ? t('reviewTitle') : t('title')}
        subtitle={isReview ? t('reviewSubtitle') : t('subtitle')}
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
      <SessionsFilters
        key={params.search}
        params={params}
        counts={data?.counts}
        onChange={update}
      />
      {list.error ? <ErrorNotice error={list.error} /> : null}
      <SessionsGrid
        params={params}
        rows={data?.items ?? []}
        total={data?.total ?? 0}
        loading={list.isFetching}
        onPageChange={(page) => update({ page })}
      />
      <Typography sx={sessionsStyles.hint}>{t('urlHint')}</Typography>
      <NewVerificationDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </>
  )
}
