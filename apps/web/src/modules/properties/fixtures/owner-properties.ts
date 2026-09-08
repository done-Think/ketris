import type {
  OwnerPropertiesSummary,
  OwnerProperty,
  OwnerPropertyFilters,
} from '../types/owner-property'

export const ownerProperties: OwnerProperty[] = [
  {
    id: 'apt-jardins-3q',
    code: 'IMV-001',
    title: 'Apartamento 3q - Jardins',
    address: 'Alameda Campinas, 1420 - Jardins, São Paulo',
    price: 'R$ 4.800/mês',
    status: 'active',
    badgeStatus: 'active',
    purpose: 'rent',
    views: 342,
    favorites: 28,
    proposals: 5,
  },
  {
    id: 'studio-pinheiros',
    code: 'IMV-002',
    title: 'Studio Loft Pinheiros',
    address: 'Rua Cunha Gago, 400 - Pinheiros, São Paulo',
    price: 'R$ 3.200/mês',
    status: 'active',
    badgeStatus: 'active',
    purpose: 'rent',
    views: 124,
    favorites: 12,
    proposals: 2,
  },
  {
    id: 'casa-alto-pinheiros',
    code: 'IMV-003',
    title: 'Casa Duplex Alto da Lapa',
    address: 'Rua Bacia de Campos, 12 - Alto da Lapa, São Paulo',
    price: 'R$ 8.900/mês',
    status: 'active',
    badgeStatus: 'active',
    purpose: 'rent',
    views: 204,
    favorites: 18,
    proposals: 1,
  },
  {
    id: 'apt-moema-2q',
    code: 'IMV-004',
    title: 'Apartamento Moderno Moema',
    address: 'Av. Lavandisca, 340 - Moema, São Paulo',
    price: 'R$ 5.500/mês',
    status: 'paused',
    badgeStatus: 'active',
    purpose: 'rent',
    views: 410,
    favorites: 35,
    proposals: 0,
  },
]

// The summary intentionally mirrors the reference instead of being derived from the cards.
export const ownerPropertiesSummary: OwnerPropertiesSummary = {
  totalProperties: 4,
  activeProperties: 3,
  pausedProperties: 1,
  totalViews: 342,
  openProposals: 7,
}

export const ownerPropertiesDefaultFilters: OwnerPropertyFilters = {
  searchQuery: '',
  status: 'all',
  purpose: 'rent',
}
