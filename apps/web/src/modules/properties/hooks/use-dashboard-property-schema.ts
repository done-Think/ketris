import { useMemo } from 'react'
import { useTranslations } from 'next-intl'

import { createDashboardPropertySchema } from '../schemas/create-dashboard-property-schema'
import { isPostalCodeNotFound } from '../services/postal-code-service'

export function useDashboardPropertySchema() {
  const t = useTranslations('properties.create')
  return useMemo(
    () => createDashboardPropertySchema((key) => t(`errors.${key}`), { isPostalCodeNotFound }),
    [t],
  )
}
