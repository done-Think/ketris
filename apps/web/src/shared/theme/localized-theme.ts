import { enUS, esES, ptBR } from '@mui/material/locale'
import { createTheme } from '@mui/material/styles'
import { enUS as gridEn, esES as gridEs, ptBR as gridPt } from '@mui/x-data-grid/locales'
import { enUS as pickerEn, esES as pickerEs, ptBR as pickerPt } from '@mui/x-date-pickers/locales'

import { resolveLocale } from '@/i18n/routing'
import { theme } from './theme'

const muiLocales = {
  'pt-BR': { material: ptBR, grid: gridPt, picker: pickerPt },
  'en-US': { material: enUS, grid: gridEn, picker: pickerEn },
  'es-ES': { material: esES, grid: gridEs, picker: pickerEs },
}

export function getLocalizedTheme(locale: string) {
  const messages = muiLocales[resolveLocale(locale)]
  return createTheme(theme, messages.material, messages.grid)
}

export function getDatePickerLocaleText(locale: string) {
  return muiLocales[resolveLocale(locale)].picker.components.MuiLocalizationProvider.defaultProps
    .localeText
}
