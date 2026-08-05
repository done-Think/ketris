import Link from 'next/link'
import { Box, Button, Typography } from '@mui/material'

type AuthStatusCardProps = {
  title: string
  description: string
}

export function AuthStatusCard({ title, description }: AuthStatusCardProps) {
  return (
    <Box>
      <Typography variant="h3" sx={{ mb: 1 }}>
        {title}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {description}
      </Typography>
      <Button component={Link} href="/login" variant="contained">
        Voltar para o login
      </Button>
    </Box>
  )
}
