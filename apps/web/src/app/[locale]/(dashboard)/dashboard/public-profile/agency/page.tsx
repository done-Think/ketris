import { requireDashboardFeature } from '@server/auth/session/require-dashboard-feature'
import { AgencyPublicProfileEditorPage } from '@modules/marketplace/components/AgencyPublicProfileEditorPage'

export default async function DashboardAgencyPublicProfilePage() {
  await requireDashboardFeature('agencyPublicProfile')
  return <AgencyPublicProfileEditorPage />
}
