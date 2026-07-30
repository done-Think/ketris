import Link from 'next/link'
import { Box, Typography, Button } from '@mui/material'

export default function NotFound() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 12 }}>
      <Typography variant="h2">404</Typography>
      <Typography color="text.secondary">Página não encontrada.</Typography>
      <Button component={Link} href="/" variant="contained">
        Voltar ao início
      </Button>
    </Box>
  )
}
