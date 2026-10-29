import type { BillingSummary } from './platform-billing'
import type { ChargedPlatformTenant } from './platform-tenant'

export interface PlatformBilling {
  charged: ChargedPlatformTenant[]
  summary: BillingSummary
}
