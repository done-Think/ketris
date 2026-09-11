import { locale as getRootLocale } from 'next/root-params'
import { getRequestConfig } from 'next-intl/server'

import { defaultTimeZone, formats } from './formats'
import { defaultLocale, isAppLocale } from './routing'
import type { AppLocale } from './types/locale.types'

export default getRequestConfig(async ({ locale }) => {
  const candidateLocale = locale ?? (await getRootLocale()) ?? defaultLocale
  const currentLocale = isAppLocale(candidateLocale) ? candidateLocale : defaultLocale

  return {
    locale: currentLocale,
    formats,
    timeZone: defaultTimeZone,
    messages: await loadMessages(currentLocale),
  }
})

async function loadMessages(locale: AppLocale) {
  const [common, auth, contracts, crm, dashboard, marketplace, platform, properties, validation] =
    await Promise.all([
      import(`./messages/${locale}/common.json`),
      import(`./messages/${locale}/auth.json`),
      import(`./messages/${locale}/contracts.json`),
      import(`./messages/${locale}/crm.json`),
      import(`./messages/${locale}/dashboard.json`),
      import(`./messages/${locale}/marketplace.json`),
      import(`./messages/${locale}/platform.json`),
      import(`./messages/${locale}/properties.json`),
      import(`./messages/${locale}/validation.json`),
    ])

  return {
    common: common.default,
    auth: auth.default,
    contracts: contracts.default,
    crm: crm.default,
    dashboard: dashboard.default,
    marketplace: marketplace.default,
    platform: platform.default,
    properties: properties.default,
    validation: validation.default,
  }
}
