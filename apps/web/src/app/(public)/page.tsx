import { Box, Container, Typography, Button } from '@mui/material'
import Link from 'next/link'

// Home / marketplace público — renderizada no servidor (SEO).
export default function HomePage() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: { xs: 8, md: 12 }, textAlign: 'center' }}>
        <Typography variant="h1" gutterBottom>
          Ketris
        </Typography>
        <Typography variant="h5" color="text.secondary" sx={{ mb: 4, fontWeight: 400 }}>
          A infraestrutura digital do mercado imobiliário.
        </Typography>
        <Button component={Link} href="/imoveis" variant="contained" size="large">
          Explorar imóveis
        </Button>
      </Box>
    </Container>
  )
}
