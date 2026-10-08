import { describe, expect, it, vi } from 'vitest'
import { createLocalizedMetadata } from '@/i18n/metadata'
import pt from '@/i18n/messages/pt-BR/charges.json'
import en from '@/i18n/messages/en-US/charges.json'
import es from '@/i18n/messages/es-ES/charges.json'

vi.mock('next-intl/server', async () => {
  const { createTranslator } = await vi.importActual<typeof import('next-intl')>('next-intl')
  return {
    getTranslations: async ({
      locale,
      namespace,
    }: {
      locale: string
      namespace: 'charges.metadata'
    }) => {
      const messages = await import(`../../../i18n/messages/${locale}/charges.json`)
      return createTranslator({ locale, namespace, messages: { charges: messages.default } })
    },
  }
})

describe('charge metadata contract', () => {
  it.each([
    ['pt-BR', pt],
    ['en-US', en],
    ['es-ES', es],
  ] as const)('resolves title and description in %s', async (locale, messages) => {
    expect(await createLocalizedMetadata('charges.metadata', locale)).toEqual({
      title: messages.metadata.title,
      description: messages.metadata.description,
    })
  })
})
