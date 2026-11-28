'use client'

import { canConnectInstagram } from '@shared/lib/auth/instagram-access'

import { useEffect, useState } from 'react'
import { Alert, Box, Button, Stack, Typography } from '@mui/material'
import InstagramIcon from '@mui/icons-material/Instagram'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useQueryClient } from '@tanstack/react-query'
import { useInstagramConnection, useDisconnectInstagram } from '@shared/hooks/use-instagram'
import { instagramService } from '@shared/lib/api/instagram-service'
import { styles } from './instagram-connection-card.styles'

export function InstagramConnectionCard() {
  const { data: session } = useSession()
  return canConnectInstagram(session?.role) ? <PersonalInstagramConnectionCard /> : null
}

function PersonalInstagramConnectionCard() {
  const t = useTranslations('properties.instagram')
  const query = useInstagramConnection()
  const disconnect = useDisconnectInstagram()
  const client = useQueryClient()
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState(false)
  useEffect(() => {
    const url = new URL(window.location.href)
    const result = url.searchParams.get('instagram')
    if (!result) return
    setError(result === 'error')
    client.invalidateQueries({ queryKey: ['instagram-connection'] })
    client.invalidateQueries({ queryKey: ['instagram-publications'] })
    url.searchParams.delete('instagram')
    window.history.replaceState(null, '', url)
  }, [client])
  async function connect() {
    setConnecting(true)
    setError(false)
    try {
      window.location.assign((await instagramService.connect()).authorizationUrl)
    } catch {
      setError(true)
      setConnecting(false)
    }
  }
  return (
    <Box sx={styles.root}>
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1} alignItems="center">
          <InstagramIcon color="primary" />
          <Typography sx={styles.title}>{t('connectionTitle')}</Typography>
        </Stack>
        <Typography variant="body2">
          {query.data?.connected
            ? t('connected', { username: query.data.username ?? '' })
            : t('connectionDescription')}
        </Typography>
        {query.data?.expired && <Alert severity="warning">{t('expired')}</Alert>}
        {(error || query.isError || disconnect.isError) && (
          <Alert severity="error">{t('connectionError')}</Alert>
        )}
        {query.data?.configured === false && <Alert severity="info">{t('unavailable')}</Alert>}
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          <Button
            type="button"
            variant="outlined"
            disabled={!query.data?.configured || connecting || disconnect.isPending}
            onClick={connect}
          >
            {t(query.data?.connected ? 'reconnect' : 'connect')}
          </Button>
          {query.data?.connected && (
            <Button
              type="button"
              disabled={disconnect.isPending || connecting}
              onClick={() => disconnect.mutate()}
            >
              {t('disconnect')}
            </Button>
          )}
        </Stack>
      </Stack>
    </Box>
  )
}
