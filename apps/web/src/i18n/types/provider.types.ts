import type { AbstractIntlMessages } from 'next-intl'

import type { AppLocale } from './locale.types'

export type I18nProviderConfig = {
  locale: AppLocale
  messages: AbstractIntlMessages
  timeZone: string
}
