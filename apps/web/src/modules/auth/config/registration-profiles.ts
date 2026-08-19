import type { RegistrationProfile, RegistrationProfileId } from '../types/registration'

export const REGISTRATION_PROFILE_IDS = [
  'proprietario',
  'corretor',
  'imobiliaria',
  'construtora',
  'locatario',
] as const satisfies readonly RegistrationProfileId[]

export const DEFAULT_REGISTRATION_PROFILE: RegistrationProfileId = 'proprietario'

export const REGISTRATION_PROFILES: readonly RegistrationProfile[] = [
  {
    id: 'proprietario',
    title: 'Proprietário',
    description: 'Gerencie seus imóveis e encontre inquilinos',
    icon: 'owner',
  },
  {
    id: 'corretor',
    title: 'Corretor',
    description: 'Conecte-se a proprietários e feche mais negócios',
    icon: 'broker',
  },
  {
    id: 'imobiliaria',
    title: 'Imobiliária',
    description: 'Gerencie sua carteira e equipe de corretores',
    icon: 'agency',
  },
  {
    id: 'construtora',
    title: 'Construtora',
    description: 'Lance empreendimentos e gerencie vendas',
    icon: 'developer',
  },
  {
    id: 'locatario',
    title: 'Locatário',
    description: 'Encontre o imóvel ideal para morar',
    icon: 'tenant',
  },
]

export function isRegistrationProfileId(value: unknown): value is RegistrationProfileId {
  return REGISTRATION_PROFILE_IDS.includes(value as RegistrationProfileId)
}
