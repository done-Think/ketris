export const propertyTypeFilterOptions = [
  'Todos os tipos',
  'Apartamento',
  'Cobertura',
  'Loft',
  'Casa',
] as const

// `label` é usado como chave de tradução em `options.<label>`, então precisa ser um
// identificador estável: o next-intl reserva o "." para expressar aninhamento e rejeita
// chaves como "Até R$ 6.000". O texto exibido vive nos arquivos de mensagens.
export const priceFilterOptions = [
  { label: 'price', max: null },
  { label: 'upTo6000', max: 6000 },
  { label: 'upTo10000', max: 10000 },
] as const

export const bedroomFilterOptions = [
  { label: 'bedrooms', min: null },
  { label: 'bedrooms2Plus', min: 2 },
  { label: 'bedrooms3Plus', min: 3 },
] as const

export const areaFilterOptions = [
  { label: 'area', min: null },
  { label: 'area90Plus', min: 90 },
  { label: 'area100Plus', min: 100 },
] as const

export const moreFilterOptions = [
  { label: 'all', onlyWithParking: false },
  { label: 'withParking', onlyWithParking: true },
] as const
