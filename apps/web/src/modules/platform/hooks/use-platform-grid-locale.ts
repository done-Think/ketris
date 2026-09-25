import { enUS, esES, ptBR } from '@mui/x-data-grid/locales'
import { useLocale, useTranslations } from 'next-intl'

export function usePlatformGridLocale() {
  const locale = useLocale()
  const t = useTranslations('platform.table')
  const messages = locale === 'pt-BR' ? ptBR : locale === 'es-ES' ? esES : enUS

  return {
    ...messages.components.MuiDataGrid.defaultProps.localeText,
    MuiTablePagination: {
      getItemAriaLabel: (type: 'first' | 'last' | 'next' | 'previous') => t(type),
    },
  }
}
