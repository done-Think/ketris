import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Box, CircularProgress } from '@mui/material'

import { PropertiesSearchPage } from '@modules/marketplace/components/PropertiesSearchPage'

export const metadata: Metadata = {
  title: 'Imóveis para comprar e alugar | Ketris',
  description:
    'Encontre imóveis residenciais e comerciais com filtros por localização, tipo e faixa de preço.',
}

export default function ImoveisPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
          <CircularProgress aria-label="Carregando imóveis" />
        </Box>
      }
    >
      <PropertiesSearchPage />
    </Suspense>
  )
}
