'use client'

import { canConnectInstagram } from '@shared/lib/auth/instagram-access'

import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useQueryClient } from '@tanstack/react-query'
import { useSnackbar } from 'notistack'
import { InstagramConnectionCard } from '@shared/components/integrations/InstagramConnectionCard'
import { InstagramPostEditor } from '@shared/components/integrations/InstagramPostEditor'
import { useInstagramConnection, useInstagramPublications } from '@shared/hooks/use-instagram'
import { instagramService } from '@shared/lib/api/instagram-service'
import { styles } from '../styles/property-instagram-panel.styles'
import type { PropertyInstagramPanelProps } from '../types/instagram'

export function PropertyInstagramPanel({ property }: PropertyInstagramPanelProps) {
  const { data: session } = useSession()
  return canConnectInstagram(session?.role) ? (
    <PersonalPropertyInstagramPanel property={property} />
  ) : null
}

function PersonalPropertyInstagramPanel({ property }: PropertyInstagramPanelProps) {
  const t = useTranslations('properties.instagram')
  const connection = useInstagramConnection()
  const publications = useInstagramPublications(property.id, Boolean(connection.data?.configured))
  const client = useQueryClient()
  const { enqueueSnackbar } = useSnackbar()
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [caption, setCaption] = useState('')
  const [busy, setBusy] = useState(false)
  const job = publications.data?.publications.find(
    (item) => item.accountId === connection.data?.accountId,
  )
  const images = [...new Set(property.media.map((image) => image.url))]
  const canSubmit =
    connection.data?.connected &&
    !connection.data.expired &&
    property.apiStatus === 'PUBLISHED' &&
    (!job || ['FAILED', 'CANCELLED'].includes(job.status)) &&
    !publications.isPending &&
    !publications.isError
  async function submit() {
    setBusy(true)
    try {
      await instagramService.queue(property.id, { caption, imageUrls: selected })
      await client.invalidateQueries({ queryKey: ['instagram-publications'] })
      enqueueSnackbar(t('queued'), { variant: 'info' })
      setOpen(false)
    } catch {
      enqueueSnackbar(t('postError'), { variant: 'error' })
    } finally {
      setBusy(false)
    }
  }
  async function retry() {
    if (!job) return
    setBusy(true)
    try {
      await instagramService.retry(job.id)
      await publications.refetch()
    } catch {
      enqueueSnackbar(t('postError'), { variant: 'error' })
    } finally {
      setBusy(false)
    }
  }
  return (
    <Box sx={styles.root}>
      <InstagramConnectionCard />
      <Stack spacing={1.5}>
        {publications.isError && connection.data?.configured && (
          <Alert severity="error">{t('loadError')}</Alert>
        )}
        {publications.data?.publications.map((entry) => (
          <Alert
            key={entry.id}
            severity={
              entry.status === 'PUBLISHED'
                ? 'success'
                : ['FAILED', 'BLOCKED'].includes(entry.status)
                  ? 'warning'
                  : 'info'
            }
          >
            <Typography variant="body2">{t(`statuses.${entry.status}`)}</Typography>
            {entry.permalink && (
              <Button
                component="a"
                href={entry.permalink}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('viewPost')}
              </Button>
            )}
            {entry.id === job?.id && entry.status === 'FAILED' && (
              <Button disabled={busy} onClick={retry}>
                {t('retry')}
              </Button>
            )}
          </Alert>
        ))}
        {(!job || ['FAILED', 'CANCELLED'].includes(job.status)) && (
          <Button
            variant="outlined"
            disabled={!canSubmit}
            onClick={() => {
              setSelected(images.slice(0, 20))
              setCaption(
                `${property.title}\n${property.location}\n${property.price}`.slice(0, 2200),
              )
              setOpen(true)
            }}
          >
            {t('reviewPost')}
          </Button>
        )}
      </Stack>
      <Dialog
        open={open}
        onClose={() => {
          if (!busy) setOpen(false)
        }}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>{t('target', { username: connection.data?.username ?? '' })}</DialogTitle>
        <DialogContent>
          <InstagramPostEditor
            images={images}
            selected={selected}
            caption={caption}
            onSelectionChange={setSelected}
            onCaptionChange={setCaption}
            disabled={busy}
          />
        </DialogContent>
        <DialogActions>
          <Button disabled={busy} onClick={() => setOpen(false)}>
            {t('cancel')}
          </Button>
          <Button
            variant="contained"
            disabled={
              busy || !selected.length || !connection.data?.connected || connection.data.expired
            }
            onClick={submit}
          >
            {t('confirmPost')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
