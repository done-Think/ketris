import { createTranslator } from 'next-intl'
import { describe, expect, it } from 'vitest'

import en from '@/i18n/messages/en-US/properties.json'
import es from '@/i18n/messages/es-ES/properties.json'
import pt from '@/i18n/messages/pt-BR/properties.json'
import {
  createPropertyFeatureOptions,
  createPropertyPublishingOptions,
  createPropertyPurposeOptions,
  createPropertyTypeOptions,
} from '../../config/dashboard-property-ui'

const locales = [
  { locale: 'pt-BR', messages: pt },
  { locale: 'en-US', messages: en },
  { locale: 'es-ES', messages: es },
]

describe.each(locales)('property form options in $locale', ({ locale, messages }) => {
  it('translates every stable form value without using labels as identifiers', () => {
    const t = createTranslator({ locale, messages, namespace: 'create' })
    const keys = [
      ...createPropertyTypeOptions.map((value) => `propertyTypes.${value}` as const),
      ...createPropertyPurposeOptions.map((value) => `purposes.${value}` as const),
      ...createPropertyFeatureOptions.map((value) => `features.${value}` as const),
      ...createPropertyPublishingOptions.map((value) => `publishingOptions.${value}` as const),
    ]
    for (const key of keys) {
      expect(t.has(key)).toBe(true)
      expect(t(key)).not.toBe(`create.${key}`)
    }
    expect(t('propertyTypes.apartment')).toBe(messages.create.propertyTypes.apartment)
  })
})
