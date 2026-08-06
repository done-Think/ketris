export const REGISTRATION_PROFILE_IDS = [
  'proprietario',
  'corretor',
  'imobiliaria',
  'construtora',
  'locatario',
] as const

export type RegistrationProfileId = (typeof REGISTRATION_PROFILE_IDS)[number]

export const DEFAULT_REGISTRATION_PROFILE: RegistrationProfileId = 'proprietario'

export type RegistrationProfile = {
  id: RegistrationProfileId
  title: string
  description: string
  icon: 'square' | 'briefcase' | 'circle'
}

export const REGISTRATION_PROFILES: readonly RegistrationProfile[] = [
  {
    id: 'proprietario',
    title: 'Proprietário',
    description: 'Gerencie seus imóveis e encontre inquilinos',
    icon: 'square',
  },
  {
    id: 'corretor',
    title: 'Corretor',
    description: 'Conecte-se a proprietários e feche mais negócios',
    icon: 'briefcase',
  },
  {
    id: 'imobiliaria',
    title: 'Imobiliária',
    description: 'Gerencie sua carteira e equipe de corretores',
    icon: 'briefcase',
  },
  {
    id: 'construtora',
    title: 'Construtora',
    description: 'Lance empreendimentos e gerencie vendas',
    icon: 'circle',
  },
  {
    id: 'locatario',
    title: 'Locatário',
    description: 'Encontre o imóvel ideal para morar',
    icon: 'circle',
  },
]

export function isRegistrationProfileId(value: unknown): value is RegistrationProfileId {
  return REGISTRATION_PROFILE_IDS.includes(value as RegistrationProfileId)
}
