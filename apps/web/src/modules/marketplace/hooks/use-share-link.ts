'use client'

import { useTranslations } from 'next-intl'
import { useSnackbar } from 'notistack'

import type { ShareLinkInput } from '../types/share-link'
import { shareLink } from '../utils/share-link'

export function useShareLink() {
  const t = useTranslations('marketplace.propertyDetail')
  const { enqueueSnackbar } = useSnackbar()

  return async function share(input: ShareLinkInput) {
    const result = await shareLink(input)

    if (result === 'copied') enqueueSnackbar(t('linkCopied'), { variant: 'success' })
    if (result === 'failed') enqueueSnackbar(t('shareError'), { variant: 'error' })

    return result
  }
}
