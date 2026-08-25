export const searchOptions = {
  location: {
    label: 'Localização',
    query: 'location',
    values: [
      'Jardins, São Paulo',
      'Vila Madalena, São Paulo',
      'Itaim Bibi, São Paulo',
      'Moema, São Paulo',
      'Pinheiros, São Paulo',
      'Savassi, Belo Horizonte',
      'Batista Campos, Belém',
    ],
  },
  propertyType: {
    label: 'Tipo de imóvel',
    query: 'propertyType',
    values: [
      'Apartamento',
      'Casas residenciais',
      'Salas comerciais',
      'Terrenos e lotes',
      'Coberturas',
      'Chácaras e sítios',
      'Studios',
    ],
  },
  priceRange: {
    label: 'Faixa de preço',
    query: 'priceRange',
    values: [
      'Até R$ 2.500',
      'R$ 2.500 - R$ 6.000',
      'R$ 6.000 - R$ 10.000',
      'R$ 10.000 - R$ 18.000',
      'R$ 18.000 - R$ 35.000',
      'Acima de R$ 35.000',
    ],
  },
} as const

export const searchFilterOrder = ['location', 'propertyType', 'priceRange'] as const
export const textSearchFilterOrder = ['location', 'propertyType'] as const

export const priceLimit = {
  min: 0,
  max: 10000,
  step: 500,
}
