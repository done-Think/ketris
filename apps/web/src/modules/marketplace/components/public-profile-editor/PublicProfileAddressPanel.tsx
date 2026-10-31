'use client'

import { useState } from 'react'
import { Alert, Button, Link, Stack, Typography } from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import { useLocale, useTranslations } from 'next-intl'
import { useSnackbar } from 'notistack'
import { getPathname } from '@/i18n/navigation'
import type { AppLocale } from '@/i18n/types/locale.types'
import { buildPublicProfileAddress } from '@shared/utils/public-profile-handle'
import { useOwnProfileAddress } from '../../hooks/use-profile-address'
import { useMarketplaceActorKey } from '../../hooks/use-marketplace-actor-key'
import type { ProfileAddressPanelProps } from '../../types/profile-address'
import { styles } from '../../styles/profile-address.styles'
import { PublicProfileEditorPanel } from './PublicProfileEditorPanel'
import { PublicProfileAddressDialog } from './PublicProfileAddressDialog'

export function PublicProfileAddressPanel({ kind }: ProfileAddressPanelProps) {
  const t = useTranslations('marketplace.profileAddress')
  const locale = useLocale() as AppLocale
  const scope = useMarketplaceActorKey()
  const { enqueueSnackbar } = useSnackbar()
  const address = useOwnProfileAddress(kind)
  const [editing, setEditing] = useState(false)
  const data = address.data
  const href = data?.handle
    ? buildPublicProfileAddress(data.handle)
    : data
      ? getPathname({
          locale,
          href: {
            pathname: kind === 'broker' ? '/brokers/[id]' : '/agencies/[id]',
            params: { id: data.profileId },
          },
        })
      : null

  async function copy() {
    if (!href) return
    try {
      await navigator.clipboard.writeText(new URL(href, window.location.origin).href)
      enqueueSnackbar(t('copied'), { variant: 'success' })
    } catch {
      enqueueSnackbar(t('copyError'), { variant: 'error' })
    }
  }

  return (
    <PublicProfileEditorPanel fullRow title={t('title')}>
      {address.isError ? (
        <Alert
          severity="error"
          action={
            <Button type="button" onClick={() => void address.refetch()}>
              {t('retry')}
            </Button>
          }
        >
          {t('loadError')}
        </Alert>
      ) : null}
      {address.isPending ? <Typography role="status">{t('loading')}</Typography> : null}
      {data && href ? (
        <>
          <Link href={href} sx={styles.link} target="_blank" rel="noopener noreferrer">
            {href}
          </Link>
          <Typography variant="body2" sx={styles.hint}>
            {t('publishedHint')}
          </Typography>
          <Stack direction="row" sx={styles.actions}>
            <Button
              type="button"
              variant="outlined"
              startIcon={<EditOutlinedIcon />}
              onClick={() => setEditing(true)}
            >
              {t('edit')}
            </Button>
            <Button type="button" startIcon={<ContentCopyIcon />} onClick={() => void copy()}>
              {t('copy')}
            </Button>
          </Stack>
          {editing ? (
            <PublicProfileAddressDialog
              key={`${scope}:${kind}`}
              kind={kind}
              handle={data.handle}
              onClose={() => setEditing(false)}
            />
          ) : null}
        </>
      ) : null}
    </PublicProfileEditorPanel>
  )
}
