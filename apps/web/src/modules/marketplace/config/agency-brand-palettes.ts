import { brand, surface } from '@shared/theme/tokens'

import type { AgencyBrandPalette } from '../types/agency-brand-editor'

const ketrisBrandPalette: AgencyBrandPalette = {
  id: 'ketris',
  backgroundColor: surface.paper,
  primaryColor: brand.magenta[500],
  secondaryColor: brand.graphite[500],
}

export const agencyBrandPalettes: readonly AgencyBrandPalette[] = [
  ketrisBrandPalette,
  { id: 'ocean', backgroundColor: '#EAF4FB', primaryColor: '#0B6BCB', secondaryColor: '#0A2540' },
  { id: 'forest', backgroundColor: '#EEF6EF', primaryColor: '#1B7F3B', secondaryColor: '#123821' },
  {
    id: 'terracotta',
    backgroundColor: '#FBF1EA',
    primaryColor: '#B4501A',
    secondaryColor: '#4A2412',
  },
  {
    id: 'graphite',
    backgroundColor: '#212631',
    primaryColor: '#D64545',
    secondaryColor: '#FFFFFF',
  },
  { id: 'wine', backgroundColor: '#F7EEF1', primaryColor: '#8E1B3D', secondaryColor: '#3A0B19' },
]
