import { CreateTenantForm, PlatformPageLayout } from '@modules/platform'

export const metadata = { title: 'Ketris | Nova imobiliária Plataforma' }

export default function PlatformNewTenantPage() {
  return (
    <PlatformPageLayout title="Nova imobiliária">
      <CreateTenantForm />
    </PlatformPageLayout>
  )
}
