export const propertyTypeFilterOptions = [
  'Todos os tipos',
  'Apartamento',
  'Cobertura',
  'Loft',
  'Casa',
] as const

export const priceFilterOptions = [
  { label: 'Preço', max: null },
  { label: 'Até R$ 6.000', max: 6000 },
  { label: 'Até R$ 10.000', max: 10000 },
] as const

export const bedroomFilterOptions = [
  { label: 'Quartos', min: null },
  { label: '2+ quartos', min: 2 },
  { label: '3+ quartos', min: 3 },
] as const

export const areaFilterOptions = [
  { label: 'Área', min: null },
  { label: '90m²+', min: 90 },
  { label: '100m²+', min: 100 },
] as const

export const moreFilterOptions = [
  { label: 'Todos', onlyWithParking: false },
  { label: 'Com vaga', onlyWithParking: true },
] as const
