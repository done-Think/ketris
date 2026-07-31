import { Container, Typography } from '@mui/material'

export const metadata = { title: 'Ketris' }

export default function DashboardPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" gutterBottom>
        Painel
      </Typography>
      <Typography color="text.secondary">
        Dashboards (MUI X Charts), CRM, financeiro e contratos — a implementar.
      </Typography>
    </Container>
  )
}
