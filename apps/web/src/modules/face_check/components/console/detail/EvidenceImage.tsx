'use client'

import { Box, CircularProgress, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

import { useTenantSessionScope } from '@shared/hooks/use-tenant-session-scope'

import { consoleService } from '../../../services/console-service'
import { detailStyles as styles } from '../../../styles/console.styles'
import { ErrorNotice } from '../../ui'
import { ApiError } from '../../../services/api-error'

export function EvidenceImage({
  sessionId,
  reference,
  label,
}: {
  sessionId: string
  reference: string
  label: string
}) {
  const { tenantId, userId, role, enabled } = useTenantSessionScope()
  const t = useTranslations('face_check.console.detail.evidence')
  const [url, setUrl] = useState<string>()
  const [error, setError] = useState<unknown>()
  useEffect(() => {
    let active = true
    let objectUrl: string | undefined
    const controller = new AbortController()
    setUrl(undefined)
    setError(undefined)
    if (enabled)
      void consoleService
        .getEvidence(sessionId, reference, controller.signal)
        .then((blob) => {
          if (active) {
            objectUrl = URL.createObjectURL(blob)
            setUrl(objectUrl)
          }
        })
        .catch((failure) => {
          if (active) setError(failure)
        })
    return () => {
      active = false
      controller.abort()
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [sessionId, reference, tenantId, userId, role, enabled])
  if (error instanceof ApiError && (error.code === 'EVIDENCE_NOT_FOUND' || error.status === 410))
    return <Typography role="status">{t('deleted')}</Typography>
  if (error) return <ErrorNotice error={error} />
  if (!url) return <CircularProgress size={24} aria-label={label} />
  return (
    <Box
      component="a"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      sx={styles.evidenceLink}
    >
      <Box component="img" src={url} alt={label} loading="lazy" sx={styles.evidenceImage} />
    </Box>
  )
}
