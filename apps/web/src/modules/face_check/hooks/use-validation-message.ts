import { useTranslations } from 'next-intl'

const validationKeys = [
  'nameRequired',
  'tooLong',
  'decisionRequired',
  'reasonRequired',
  'cpfInvalid',
  'agencyNameRequired',
  'propertyRequired',
  'manualOverrideNoteRequired',
  'evidenceReviewRequired',
  'manualOverrideRequired',
] as const

export function useValidationMessage() {
  const t = useTranslations('face_check.common.validation')
  return (message?: string) => {
    const key = validationKeys.find((value) => value === message)
    return key ? t(key) : undefined
  }
}
