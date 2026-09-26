import { MaintenanceTicketDetailPage } from '@modules/maintenance'

export default async function DashboardMaintenanceTicketPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return <MaintenanceTicketDetailPage ticketId={`#${id}`} />
}
