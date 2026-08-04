import { CreateTenantForm, PlatformPageLayout } from '@modules/platform'

export const metadata = { title: 'Nova imobiliária — Ketris Plataforma' }

export default function PlatformNewTenantPage() {
  return (
    <PlatformPageLayout title="Nova imobiliária">
      <CreateTenantForm />
    </PlatformPageLayout>
  )
}
