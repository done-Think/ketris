import type { DashboardProposal } from '../types/proposal'

export const dashboardProposals: DashboardProposal[] = [
  {
    id: 'proposal-001',
    client: 'Carla Rocha',
    property: 'Cobertura Itaim Bibi',
    value: 'R$ 4.320.000',
    ownerExpectation: 'Pede R$ 4.500.000',
    status: 'underReview',
  },
  {
    id: 'proposal-002',
    client: 'Rafael Lima',
    property: 'Casa Alto da Boa Vista',
    value: 'R$ 3.650.000',
    ownerExpectation: 'Pede R$ 3.800.000',
    status: 'counteroffer',
  },
  {
    id: 'proposal-003',
    client: 'João Silva',
    property: 'Apartamento Alameda Jardins',
    value: 'R$ 6.500/mês',
    ownerExpectation: 'Valor cheio',
    status: 'approved',
  },
]
