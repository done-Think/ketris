import type { AppLocale } from '@/i18n/types/locale.types'

export type LanguageSelectorVariant = 'header' | 'profile'

export type LanguageSelectorProps = {
  variant?: LanguageSelectorVariant
}

export type LanguageOption = {
  locale: AppLocale
  label: string
  shortLabel: string
  flagSrc: string
}
