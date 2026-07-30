import { Container, Typography } from '@mui/material'

export const metadata = { title: 'Entrar | Ketris' }

export default function LoginPage() {
  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Typography variant="h3" gutterBottom>
        Entrar
      </Typography>
      <Typography color="text.secondary">
        Formulário de login (React Hook Form + Zod + NextAuth) — a implementar.
      </Typography>
    </Container>
  )
}
