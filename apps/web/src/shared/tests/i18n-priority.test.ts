import { describe, expect, it } from 'vitest'
import { createTranslator } from 'next-intl'

import ptMarketplace from '@/i18n/messages/pt-BR/marketplace.json'
import enMarketplace from '@/i18n/messages/en-US/marketplace.json'
import esMarketplace from '@/i18n/messages/es-ES/marketplace.json'
import ptCrm from '@/i18n/messages/pt-BR/crm.json'
import enCrm from '@/i18n/messages/en-US/crm.json'
import esCrm from '@/i18n/messages/es-ES/crm.json'

const catalogs = {
  'pt-BR': { marketplace: ptMarketplace, crm: ptCrm },
  'en-US': { marketplace: enMarketplace, crm: enCrm },
  'es-ES': { marketplace: esMarketplace, crm: esCrm },
} as const

describe('priority i18n catalogs', () => {
  it.each(['pt-BR', 'en-US', 'es-ES'] as const)(
    'resolves zero, singular, plural, and interpolated messages in %s',
    (locale) => {
      const t = createTranslator({ locale, messages: catalogs[locale] })

      for (const count of [0, 1, 2, 10]) {
        expect(t('marketplace.searchResults.toolbar.resultCount', { count })).not.toContain('{')
        expect(t('marketplace.propertyFeatures.bedrooms', { count })).not.toContain('{')
        expect(
          t('marketplace.directory.brokers.resultCount', { total: count, visible: count }),
        ).not.toContain('{')
      }

      expect(t('marketplace.propertyFeatures.monthly', { price: 'R$ 100' })).toContain('R$ 100')
      expect(t('crm.pipeline.propertyReference', { id: '123' })).toContain('123')
      expect(t('crm.proposalManagement.viewProposal', { reference: '#PRP-0042' })).toContain(
        '#PRP-0042',
      )
    },
  )

  it('uses singular English nouns and localized proposal statuses', () => {
    const t = createTranslator({ locale: 'en-US', messages: catalogs['en-US'] })

    expect(t('marketplace.searchResults.toolbar.resultCount', { count: 1 })).toBe(
      '1 property found',
    )
    expect(t('marketplace.searchResults.toolbar.resultCount', { count: 2 })).toBe(
      '2 properties found',
    )
    expect(t('crm.opportunityDetail.statuses.EM_NEGOCIACAO')).toBe('In negotiation')
  })
})
