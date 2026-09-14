import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { defaultLocale, isAppLocale } from './routing'

export async function createLocalizedMetadata(
  namespace: string,
  locale: string | undefined,
): Promise<Metadata> {
  const currentLocale = isAppLocale(locale) ? locale : defaultLocale
  const t = await getTranslations({ locale: currentLocale, namespace })

  return {
    title: t('metadataTitle'),
    description: t.has('metadataDescription') ? t('metadataDescription') : undefined,
  }
}
