import { Container, Typography } from '@mui/material'

export const metadata = {
  title: 'Ketris',
  description: 'Busque imóveis para alugar e comprar.',
}

export default function ImoveisPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" gutterBottom>
        Imóveis
      </Typography>
      <Typography color="text.secondary">
        Marketplace com busca, filtros e mapa (MapLibre GL) — a implementar.
      </Typography>
    </Container>
  )
}
