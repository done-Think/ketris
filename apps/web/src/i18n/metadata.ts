import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { defaultLocale, isAppLocale } from './routing'
import type { MetadataNamespace } from './types/messages.types'
import type { NavigationHref } from './current-route'
import { publicMetadata } from './seo'

export async function createLocalizedMetadata(
  namespace: MetadataNamespace,
  locale: string | undefined,
  href?: NavigationHref,
): Promise<Metadata> {
  const currentLocale = isAppLocale(locale) ? locale : defaultLocale
  const t = await getTranslations({ locale: currentLocale, namespace })
  let description: string | undefined
  if (
    namespace === 'charges.metadata' ||
    namespace === 'marketplace.metadata.agencies' ||
    namespace === 'marketplace.metadata.brokers' ||
    namespace === 'marketplace.metadata.searchBuy' ||
    namespace === 'marketplace.metadata.searchRent'
  ) {
    const descriptionTranslations = await getTranslations({ locale: currentLocale, namespace })
    description = descriptionTranslations('metadataDescription')
  }

  return {
    title: t('metadataTitle'),
    description,
    ...(href ? publicMetadata(currentLocale, href) : {}),
  }
}
