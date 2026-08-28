import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

export async function createLocalizedMetadata(namespace: string): Promise<Metadata> {
  const t = await getTranslations(namespace)

  return {
    title: t('metadataTitle'),
    description: t.has('metadataDescription') ? t('metadataDescription') : undefined,
  }
}
