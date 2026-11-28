import { requireDashboardFeature } from '@server/auth/session/require-dashboard-feature'
import { PublicProfileEditorPage } from '@modules/marketplace/components/PublicProfileEditorPage'

export default async function DashboardPublicProfilePage() {
  await requireDashboardFeature('publicProfile')
  return <PublicProfileEditorPage />
}
