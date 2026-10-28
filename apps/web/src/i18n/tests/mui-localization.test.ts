import { describe, expect, it } from 'vitest'

import { getDatePickerLocaleText, getLocalizedTheme } from '@shared/theme/localized-theme'
import { theme } from '@shared/theme/theme'

describe('localized Material UI defaults', () => {
  it.each([
    ['pt-BR', 'Nenhuma linha', 'Cancelar'],
    ['en-US', 'No rows', 'Cancel'],
    ['es-ES', 'Sin filas', 'Cancelar'],
  ])(
    'localizes grid and picker text for %s while preserving the base palette',
    (locale, noRowsLabel, cancelButtonLabel) => {
      const localized = getLocalizedTheme(locale)
      expect(localized).toMatchObject({
        palette: { primary: { main: theme.palette.primary.main } },
        components: { MuiDataGrid: { defaultProps: { localeText: { noRowsLabel } } } },
      })
      expect(getDatePickerLocaleText(locale).cancelButtonLabel).toBe(cancelButtonLabel)
    },
  )
})
