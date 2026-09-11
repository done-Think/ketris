'use client'

import { useState } from 'react'
import { Box, Button, Typography } from '@mui/material'

import { ownerProperties, ownerPropertiesDefaultFilters } from '../fixtures/owner-properties'
import { filterOwnerProperties } from '../utils/owner-properties'
import { OwnerPropertiesHeader } from './OwnerPropertiesHeader'
import { OwnerPropertyCard } from './OwnerPropertyCard'

export function PropertiesDashboardPage() {
  const [filters, setFilters] = useState(ownerPropertiesDefaultFilters)
  const properties = filterOwnerProperties(ownerProperties, filters)

  return (
    <Box sx={{ width: '100%', px: { xs: 2, sm: 3, lg: 4 }, py: { xs: 1.5, md: 4.5 } }}>
      <Box sx={{ width: '100%', maxWidth: 1184, mx: 'auto' }}>
        <OwnerPropertiesHeader filters={filters} onFiltersChange={setFilters} />
        {properties.length ? (
          <Box
            component="section"
            aria-label="Imóveis do proprietário"
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(2, minmax(0, 1fr))' },
              gap: { xs: 2, md: 4 },
            }}
          >
            {properties.map((property) => (
              <OwnerPropertyCard key={property.id} property={property} />
            ))}
          </Box>
        ) : (
          <Box role="status" sx={{ textAlign: 'center', py: 8 }}>
            <Typography>Nenhum imóvel encontrado.</Typography>
            <Button onClick={() => setFilters(ownerPropertiesDefaultFilters)} sx={{ mt: 1 }}>
              Limpar filtros
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  )
}
