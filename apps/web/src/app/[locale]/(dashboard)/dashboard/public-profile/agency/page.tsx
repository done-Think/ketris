import { requireDashboardFeature } from '@shared/lib/auth/require-dashboard-feature'
import { AgencyPublicProfileEditorPage } from '@modules/marketplace/components/AgencyPublicProfileEditorPage'

export default async function DashboardAgencyPublicProfilePage() {
  await requireDashboardFeature('agencyPublicProfile')
  return <AgencyPublicProfileEditorPage />
}
