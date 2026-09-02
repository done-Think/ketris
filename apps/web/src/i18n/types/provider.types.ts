import type { AbstractIntlMessages } from 'next-intl'
import type { ReactNode } from 'react'

import type { AppLocale } from './locale.types'

export type I18nProviderConfig = {
  locale: AppLocale
  messages: AbstractIntlMessages
  timeZone: string
}

export type ProvidersProps = {
  children: ReactNode
}

export type LocaleProvidersProps = {
  children: ReactNode
  i18n: I18nProviderConfig
}
